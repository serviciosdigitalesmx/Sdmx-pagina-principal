// subscription.service.ts
import { loadSession, requireActiveSubscription } from './context.js';

export const subscriptionService = {
  async subscriptionStatus(token: string) {
    const session = await loadSession(token);
    return { subscription: session.subscription };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
  }
};
