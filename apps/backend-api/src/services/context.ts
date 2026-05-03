import { supabase as supabaseClient } from './supabase.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

// Cambiamos a función porque billing.service.ts lo intenta llamar: mpSettings()
export const mpSettings = () => ({
  publicKey: process.env.MP_PUBLIC_KEY || '',
  accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export async function loadSession(token: string): Promise<SessionDto> {
  // Usamos la referencia renombrada para evitar colisiones
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);
  if (error || !user) throw new Error('Sesión inválida');

  const tenantId = user.app_metadata.tenant_id;

  return {
    user: {
      id: user.id,
      email: user.email!,
      tenant_id: tenantId
    },
    accessGranted: true, // 🔓 Bypass total para desarrollo
    subscription: {
      status: 'active',
      plan: 'enterprise'
    } as SubscriptionDto,
    shop: {
      id: tenantId,
      name: 'Mi Taller',
      slug: 'taller',
      billing_exempt: true
    }
  } as SessionDto;
}

export function resolveTenantIdFromSession(session: SessionDto): string {
  return session.user.tenant_id;
}

export function requireActiveSubscription(session: SessionDto): void {
  // 🔓 Bypass total: no bloquea nada
  return;
}
