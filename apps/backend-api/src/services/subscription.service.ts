import { loadSession, requireActiveSubscription } from './context.js';
import type { SessionDto } from '@sdmx/contracts';

export const subscriptionService = {
  async subscriptionStatus(token: string) {
    const session = await loadSession(token);
    return { subscription: session.subscription };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const session = await loadSession(token);
    requireActiveSubscription(session); // ✅ usa la función del contexto
  }
};
