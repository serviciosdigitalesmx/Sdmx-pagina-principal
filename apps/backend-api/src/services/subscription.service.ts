import { supabase } from './supabase.js';
import { loadSession, requireActiveSubscription, resolveTenantIdFromSession } from './context.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

export const subscriptionService = {
  async subscriptionStatus(token: string): Promise<{ subscription: SubscriptionDto | null }> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);

    const subscriptions = await supabase.query<SubscriptionDto[]>(
      `subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=1&select=*`,
      token
    );

    return {
      subscription: subscriptions[0] ?? null
    };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const { subscription } = await this.subscriptionStatus(token);
    if (!subscription || String(subscription.status) !== 'active') {
      throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa para realizar esta acción.');
    }
  },

  requireActiveSubscription(session: SessionDto): void {
    requireActiveSubscription(session);
  }
};
