// context.ts
import { createClient } from '@supabase/supabase-js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';
import { env } from '../config/env.js';

const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

// Caché simple en memoria
const sessionCache = new Map<string, { session: SessionDto; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minuto

export async function loadSession(token: string): Promise<SessionDto> {
  // 1. Verificar caché
  const cached = sessionCache.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.session;
  }

  // 2. Validar token con Supabase Auth
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    throw new Error('Sesión inválida o token expirado');
  }

  // 3. Obtener el tenant desde la tabla `users`
  const { data: userRecord, error: userError } = await supabaseAdmin
    .from('users')
    .select('tenant_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single();
  if (userError || !userRecord) {
    throw new Error('Usuario no registrado en el sistema');
  }
  const tenantId = userRecord.tenant_id;

  // 4. Obtener suscripción activa del tenant
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan, current_period_end')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .maybeSingle();

  let subscriptionStatus: SubscriptionDto['status'] = 'inactive';
  let plan: SubscriptionDto['plan'] = 'basic';
  let accessGranted = false;

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
      id: user.id,
      email: user.email!,
      tenant_id: tenantId,
      full_name: userRecord.full_name
    },
    accessGranted,
    subscription: {
      status: subscriptionStatus,
      plan
    } as SubscriptionDto,
    shop: {
      id: tenantId,
      name: 'Mi Taller', // Podría venir de la tabla `tenants`
      slug: 'taller',
      billing_exempt: false
    }
  };

  // Guardar en caché
  sessionCache.set(token, { session, expiresAt: Date.now() + CACHE_TTL_MS });
  return session;
}

export function resolveTenantIdFromSession(session: SessionDto): string {
  if (!session.user?.tenant_id) throw new Error('Tenant no definido en sesión');
  return session.user.tenant_id;
}

export function requireActiveSubscription(session: SessionDto): void {
  if (!session.accessGranted) {
    throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa o en período de prueba.');
  }
}

// Función para limpiar caché (útil al hacer logout)
export function invalidateSession(token: string): void {
  sessionCache.delete(token);
}

// Configuración de Mercado Pago (sin cambios, solo ilustrativa)
export const mpSettings = () => ({
  accessToken: env.mpAccessToken,
  webhookSecret: env.mpWebhookSecret,
  appUrl: env.appUrl,
  webhookBaseUrl: env.webhookBaseUrl
});
