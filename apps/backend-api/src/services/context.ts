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

export type RequestContext = {
  token: string;
  session: SessionDto;
  tenantId: string;
};

export async function loadSession(token: string): Promise<SessionDto> {
  const authUser = await supabase.authUser(token);
  const users = await supabase.query<SessionRow[]>(`users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=*`, token);
  const user = users[0];
  assert(Boolean(user), 'Usuario no encontrado en tenant');

  const tenantId = await resolveTenantId(user, token);
  const [shops, subscriptions, userRoles] = await Promise.all([
    supabase.query<ShopDto[]>(`shops?id=eq.${encodeURIComponent(tenantId)}&select=*`, token),
    supabase.query<RawSubscriptionRow[]>(`subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=1&select=*`, token),
    supabase.query<Array<{ role_id: string; roles: RoleDto }>>(
      `user_roles?user_id=eq.${encodeURIComponent(String(user.id))}&select=role_id,roles(*)`,
      token
    )
  ]);

  return {
    accessToken: token,
    refreshToken: '',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    user: user as UserDto,
    shop: shops[0] ?? { id: tenantId, name: 'Default Shop', slug: 'default' },
    subscription: subscriptions[0] ?? null,
    roles: userRoles.map((r) => r.roles).filter(Boolean),
    permissions: []
  };
}

export async function loadContext(token: string): Promise<RequestContext> {
  const session = await loadSession(token);
  return { token, session, tenantId: String(session.shop.id) };
}

export function requireActiveSubscription(session: SessionDto): void {
  if (!session.subscription || String(session.subscription.status) !== 'active') {
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

  const branches = await supabase.query<Array<{ tenant_id: string }>>(`branches?id=eq.${encodeURIComponent(branchId)}&select=tenant_id`, token);
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
