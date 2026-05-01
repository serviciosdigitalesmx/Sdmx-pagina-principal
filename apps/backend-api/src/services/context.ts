import { supabase } from './supabase.js';
import { env } from '../config/env.js';
import {
  PlanCode,
  RoleDto,
  SessionDto,
  ShopDto,
  SubscriptionDto,
  UserDto
} from '@sdmx/contracts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

type SessionRow = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  branch_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type RawSubscriptionRow = {
  id?: string;
  tenant_id: string;
  plan: PlanCode;
  status: SubscriptionDto["status"];
  provider: SubscriptionDto["provider"];
  external_id: string;
  current_period_end?: string | null;
  raw_payload?: unknown;
  created_at?: string;
  updated_at?: string;
};

const TRIAL_PLAN: PlanCode = 'enterprise';

function normalizeSubscription(subscription: RawSubscriptionRow | null): SubscriptionDto | null {
  return subscription ? (subscription as SubscriptionDto) : null;
}

async function hasActiveAccess(tenantId: string): Promise<boolean> {
  const result = await supabase.rpcAsService<Array<{ has_active_access: boolean }>>('has_active_access', {
    p_tenant_id: tenantId
  });
  return Boolean(result?.[0]?.has_active_access);
}

function trialExpiryFromNow(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.trialDays);
  return expiresAt.toISOString();
}

async function getLatestSubscription(tenantId: string): Promise<SubscriptionDto | null> {
  const subscriptions = await supabase.queryAsService<RawSubscriptionRow[]>(
    `subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=created_at.desc`
  );
  return normalizeSubscription(subscriptions[0] ?? null);
}

async function createInitialTrialSubscription(tenantId: string): Promise<SubscriptionDto> {
  const trialEndsAt = trialExpiryFromNow();
  return {
    tenant_id: tenantId,
    plan: TRIAL_PLAN,
    status: 'trialing',
    provider: 'trial',
    external_id: `trial_${tenantId}`,
    current_period_end: trialEndsAt,
    raw_payload: {
      trialDays: env.trialDays,
      trialStartedAt: new Date().toISOString(),
      trialEndsAt
    }
  } as SubscriptionDto;
}

export type RequestContext = {
  token: string;
  session: SessionDto;
  tenantId: string;
};

export async function loadSession(token: string): Promise<SessionDto> {
  const authUser = await supabase.authUser(token);
  const users = await supabase.queryAsService<SessionRow[]>(
    `users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=*`
  );
  const user = users[0];
  assert(Boolean(user), 'Usuario no encontrado en tenant');

  const tenantId = await resolveTenantId(user, token);
  const [shops, userRoles] = await Promise.all([
    supabase.queryAsService<ShopDto[]>(`shops?id=eq.${encodeURIComponent(tenantId)}&select=*`),
    supabase.queryAsService<Array<{ role_id: string; roles: RoleDto }>>(
      `user_roles?user_id=eq.${encodeURIComponent(String(user.id))}&select=role_id,roles(*)`
    )
  ]);
  const shop = shops[0];
  if (!shop) {
    throw new Error('El tenant no tiene shop configurado');
  }
  if (!String(shop.slug || '').trim()) {
    throw new Error('El tenant no tiene slug configurado');
  }
  const access = await hasActiveAccess(tenantId);
  const latestSubscription = await getLatestSubscription(tenantId);
  const subscription = access
    ? ({
        tenant_id: tenantId,
        plan: TRIAL_PLAN,
        status: 'active',
        provider: 'trial',
        external_id: `master_${tenantId}`,
        current_period_end: null,
        raw_payload: {
          billingExempt: true,
          activatedAt: new Date().toISOString()
        }
      } as SubscriptionDto)
    : (latestSubscription ?? (await createInitialTrialSubscription(tenantId)));

  return {
    accessToken: token,
    refreshToken: '',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    accessGranted: access,
    user: user as UserDto,
    shop,
    subscription,
    roles: userRoles.map((r) => r.roles).filter(Boolean),
    permissions: []
  };
}

export async function loadContext(token: string): Promise<RequestContext> {
  const session = await loadSession(token);
  return { token, session, tenantId: String(session.shop.id) };
}

export function requireActiveSubscription(session: SessionDto): void {
  if (session.accessGranted !== true) {
    throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa para realizar esta acción.');
  }
}

export function requirePlanAccess(plan: PlanCode, minimum: PlanCode): void {
  const order: Record<PlanCode, number> = { basic: 1, pro: 2, enterprise: 3 };
  if (order[plan] < order[minimum]) {
    throw new Error('PLAN_REQUIRED: No tienes acceso a este módulo');
  }
}

export function planOrder(plan: PlanCode): number {
  const order: Record<PlanCode, number> = { basic: 1, pro: 2, enterprise: 3 };
  return order[plan];
}

async function resolveTenantId(user: SessionRow, token: string): Promise<string> {
  const explicitTenantId = user.tenant_id ? String(user.tenant_id) : '';
  if (explicitTenantId) return explicitTenantId;

  const branchId = user.branch_id ? String(user.branch_id) : '';
  assert(Boolean(branchId), 'El usuario no tiene tenant ni branch asignado');

  const branches = await supabase.queryAsService<Array<{ tenant_id: string }>>(
    `branches?id=eq.${encodeURIComponent(branchId)}&select=tenant_id`
  );
  const tenantId = branches[0]?.tenant_id ? String(branches[0].tenant_id) : '';
  assert(Boolean(tenantId), 'No se pudo resolver el tenant del usuario');
  return tenantId;
}

export function resolveTenantIdFromSession(session: SessionDto): string {
  return String(session.shop.id);
}

export function mpSettings() {
  return {
    accessToken: env.mpAccessToken,
    webhookSecret: env.mpWebhookSecret,
    appUrl: env.appUrl,
    webhookBaseUrl: env.webhookBaseUrl
  };
}
