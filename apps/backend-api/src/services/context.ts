import { createClient } from '@supabase/supabase-js';
import type { SessionDto, SubscriptionDto, UserDto } from '@sdmx/contracts';
import { env } from '../config/env.js';

const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export async function loadSession(token: string): Promise<SessionDto> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) throw new Error('Sesión inválida o token expirado');

  const { data: userRecord, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, tenant_id, full_name, email, auth_user_id')
    .eq('auth_user_id', user.id)
    .single();

  if (userError || !userRecord) {
    throw new Error('Usuario no registrado en el sistema');
  }

  const tenantId = userRecord.tenant_id;

  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .maybeSingle();

  let accessGranted = true; // TODO: cambiar a lógica real cuando se implemente billing
  let subscriptionStatus: SubscriptionDto['status'] = 'active';
  let plan: SubscriptionDto['plan'] = 'enterprise';

  if (!subError && subscription) {
    const isActive = subscription.status === 'active';
    const isTrialing = subscription.status === 'trialing';
    const notExpired = !subscription.current_period_end || new Date(subscription.current_period_end) > new Date();
    if ((isActive || isTrialing) && notExpired) {
      accessGranted = true;
      subscriptionStatus = subscription.status;
      plan = subscription.plan;
    }
  }

  const session: SessionDto = {
    user: {
      id: userRecord.id,
      auth_user_id: user.id,
      tenant_id: tenantId,
      full_name: userRecord.full_name,
      email: user.email!,
      branch_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as UserDto,
    accessGranted,
    subscription: {
      status: subscriptionStatus,
      plan,
      tenant_id: tenantId,
      provider: 'trial',
      external_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as SubscriptionDto,
    shop: {
      id: tenantId,
      name: userRecord.full_name?.split(' ')[0] || 'Mi Taller',
      slug: 'taller',
      billing_exempt: true
    },
    accessToken: token,
    refreshToken: '',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    roles: [],
    permissions: []
  };

  return session;
}

export function resolveTenantIdFromSession(session: SessionDto): string {
  return session.user.tenant_id;
}

export function requireActiveSubscription(session: SessionDto): void {
  if (!session.accessGranted) {
    throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa o en período de prueba.');
  }
}

export const mpSettings = () => ({
  accessToken: env.mpAccessToken,
  webhookSecret: env.mpWebhookSecret,
  appUrl: env.appUrl,
  webhookBaseUrl: env.webhookBaseUrl
});
