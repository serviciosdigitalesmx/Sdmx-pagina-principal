import { loadSession, requireActiveSubscription } from './context.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

export const subscriptionService = {
  async subscriptionStatus(token: string): Promise<{ subscription: SubscriptionDto | null }> {
    return {
      subscription: (await loadSession(token)).subscription
    };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const { subscription } = await this.subscriptionStatus(token);
    const status = String(subscription?.status || '');
    const trialEndsAt = subscription?.current_period_end ? new Date(subscription.current_period_end).getTime() : 0;
    const trialStillValid = status === 'trialing' && (!trialEndsAt || Date.now() <= trialEndsAt);
    if (!subscription || (status !== 'active' && !trialStillValid)) {
      throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa para realizar esta acción.');
    }
  },

  requireActiveSubscription(session: SessionDto): void {
    requireActiveSubscription(session);
  }
};
