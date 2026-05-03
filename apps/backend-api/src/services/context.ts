import { createClient } from '@supabase/supabase-js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

// Inicializamos una instancia interna solo para el contexto y evitar colisiones de tipos
const internalSupabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export const mpSettings = () => ({
  publicKey: process.env.MP_PUBLIC_KEY || '',
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://sdmx-pagina-principal.vercel.app',
  webhookBaseUrl: process.env.BACKEND_URL || 'https://sdmx-backend-api.onrender.com',
  webhookSecret: process.env.MP_WEBHOOK_SECRET || 'dev_secret'
});

export async function loadSession(token: string): Promise<SessionDto> {
  const { data: { user }, error } = await internalSupabase.auth.getUser(token);
  
  if (error || !user) throw new Error('Sesión inválida');

  const tenantId = user.app_metadata.tenant_id;

  return {
    user: {
      id: user.id,
      email: user.email!,
      tenant_id: tenantId
    },
    accessGranted: true, // 🔓 Acceso total para desarrollo
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
