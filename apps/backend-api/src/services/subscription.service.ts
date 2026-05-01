import { loadSession, requireActiveSubscription } from './context.js';
import type { SessionDto, SubscriptionDto } from '@sdmx/contracts';

export const subscriptionService = {
  async subscriptionStatus(token: string): Promise<{ subscription: SubscriptionDto | null }> {
    return {
      subscription: (await loadSession(token)).subscription
    };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const session = await loadSession(token);
    if (session.accessGranted !== true) {
      throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa para realizar esta acción.');
    }
  },

  requireActiveSubscription(session: SessionDto): void {
    requireActiveSubscription(session);
  }
};
