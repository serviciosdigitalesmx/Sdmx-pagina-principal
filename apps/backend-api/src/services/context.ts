import { supabase } from './supabase.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

// Objeto requerido por billing.service.ts
export const mpSettings = {
  publicKey: process.env.MP_PUBLIC_KEY || '',
  accessToken: process.env.MP_ACCESS_TOKEN || ''
};

export async function loadSession(token: string): Promise<SessionDto> {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Sesión inválida');

  const tenantId = user.app_metadata.tenant_id;

  return {
    user: {
      id: user.id,
      email: user.email!,
      tenant_id: tenantId
    },
    accessGranted: true, // 🔓 Bypass: Siempre permitido
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

// Función requerida por casi todos tus servicios
export function resolveTenantIdFromSession(session: SessionDto): string {
  return session.user.tenant_id;
}

export function requireActiveSubscription(session: SessionDto): void {
  // 🔓 Bypass total para desarrollo
  return;
}
