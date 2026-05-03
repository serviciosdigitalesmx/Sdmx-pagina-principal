// context.ts (versión sin bloqueos)
import { createClient } from '@supabase/supabase-js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';
import { env } from '../config/env.js';

const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey);

export async function loadSession(token: string): Promise<SessionDto> {
  // Opcional: aún validar que el token sea válido, pero dar acceso aunque no haya suscripción
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      // Si no hay token válido, devolvemos un usuario por defecto para desarrollo
      return {
        user: { id: 'dev-user', email: 'dev@example.com', tenant_id: 'dev-tenant' },
        accessGranted: true,
        subscription: { status: 'active', plan: 'enterprise' } as SubscriptionDto,
        shop: { id: 'dev-tenant', name: 'Dev Shop', slug: 'dev', billing_exempt: true }
      };
    }
    // Obtener tenant (puede fallar, pero damos acceso)
    let tenantId = 'dev-tenant';
    try {
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('tenant_id')
        .eq('auth_user_id', user.id)
        .single();
      if (userRecord?.tenant_id) tenantId = userRecord.tenant_id;
    } catch (e) {
      // ignorar
    }
    return {
      user: { id: user.id, email: user.email!, tenant_id: tenantId },
      accessGranted: true, // 🔓 Siempre true
      subscription: { status: 'active', plan: 'enterprise' } as SubscriptionDto,
      shop: { id: tenantId, name: 'Mi Taller', slug: 'taller', billing_exempt: true }
    };
  } catch (error) {
    // Fallback total: sesión de desarrollo
    return {
      user: { id: 'dev-user', email: 'dev@example.com', tenant_id: 'dev-tenant' },
      accessGranted: true,
      subscription: { status: 'active', plan: 'enterprise' } as SubscriptionDto,
      shop: { id: 'dev-tenant', name: 'Dev Shop', slug: 'dev', billing_exempt: true }
    };
  }
}

export function resolveTenantIdFromSession(session: SessionDto): string {
  return session.user.tenant_id || 'dev-tenant';
}

export function requireActiveSubscription(session: SessionDto): void {
  // No hacer nada, permitir siempre
  return;
}

export const mpSettings = () => ({
  accessToken: env.mpAccessToken,
  webhookSecret: env.mpWebhookSecret,
  appUrl: env.appUrl,
  webhookBaseUrl: env.webhookBaseUrl
});
