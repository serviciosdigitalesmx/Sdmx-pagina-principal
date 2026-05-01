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

function isTrialStillValid(subscription: SubscriptionDto | null): boolean {
  if (!subscription) return false;
  if (String(subscription.status) !== 'trialing') return false;
  if (!subscription.current_period_end) return true;
  return Date.now() <= new Date(subscription.current_period_end).getTime();
}

function trialExpiryFromNow(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.trialDays);
  return expiresAt.toISOString();
}

async function ensureTrialSubscription(token: string, tenantId: string): Promise<SubscriptionDto | null> {
  const subscriptions = await supabase.queryAsService<RawSubscriptionRow[]>(
    `subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&select=*&order=created_at.desc`
  );

  const current = normalizeSubscription(subscriptions.find((item) => {
    const status = String(item.status);
    if (status === 'active') return true;
    if (status === 'trialing') return isTrialStillValid(item as SubscriptionDto);
    return false;
  }) ?? subscriptions[0] ?? null);

  if (current) return current;
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
  const shop = shops[0] ?? { id: tenantId, name: 'Default Shop', slug: 'default', billing_exempt: false };
  const isMaster =
    Boolean(env.masterTenantSlug && String(shop.slug || '').toLowerCase() === env.masterTenantSlug) ||
    Boolean(env.masterAccountEmail && String(user.email || '').toLowerCase() === env.masterAccountEmail);
  const subscription = isMaster
    ? ({
        tenant_id: tenantId,
        plan: TRIAL_PLAN,
        status: 'active',
        provider: 'trial',
        external_id: `master_${tenantId}`,
        current_period_end: null,
        raw_payload: {
          masterAccount: true,
          activatedAt: new Date().toISOString()
        }
      } as SubscriptionDto)
    : (await ensureTrialSubscription(token, tenantId));

  return {
    accessToken: token,
    refreshToken: '',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
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
  const subscription = session.subscription;
  const status = String(subscription?.status || '');
  const active = status === 'active';
  const trial = status === 'trialing' && isTrialStillValid(subscription);

  if (!subscription || (!active && !trial)) {
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
