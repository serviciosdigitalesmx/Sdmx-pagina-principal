import { supabase as supabaseClientInstance } from './supabase.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

// Agregamos todas las propiedades que billing.service.ts está reclamando
export const mpSettings = () => ({
  publicKey: process.env.MP_PUBLIC_KEY || '',
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://sdmx-pagina-principal.vercel.app',
  webhookBaseUrl: process.env.BACKEND_URL || 'https://sdmx-backend-api.onrender.com',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || 'dev_secret'
});

export async function loadSession(token: string): Promise<SessionDto> {
  // Usamos el nombre largo para que no se confunda con el servicio
  const { data: { user }, error } = await supabaseClientInstance.auth.getUser(token);
  
  if (error || !user) throw new Error('Sesión inválida');

  const tenantId = user.app_metadata.tenant_id;

  return {
    user: {
      id: user.id,
      email: user.email!,
      tenant_id: tenantId
    },
    accessGranted: true, // 🔓 Bypass total
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
  return;
}
