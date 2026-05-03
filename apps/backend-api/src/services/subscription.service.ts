import { loadSession } from './context.js';
import type { SessionDto } from '@sdmx/contracts';

export const subscriptionService = {
  // Solo consulta el estado
  async subscriptionStatus(token: string) {
    const session = await loadSession(token);
    return { subscription: session.subscription };
  },

  // Valida acceso real usando la sesión
  async ensureActiveSubscription(token: string): Promise<void> {
    const session = await loadSession(token);
    this.requireActiveSubscription(session);
  },

  // El único lugar donde se decide si alguien pasa o no
  requireActiveSubscription(session: SessionDto): void {
    if (session.accessGranted !== true) {
      throw new Error('SUBSCRIPTION_REQUIRED: Se requiere una suscripción activa para realizar esta acción.');
    }
  }
};
