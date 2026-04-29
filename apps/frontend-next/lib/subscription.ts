export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'suspended' | 'canceled';

export enum PlanLevel {
  INICIAL = 'inicial-0',
  PROFESIONAL = 'profesional-350',
  AVANZADO = 'avanzado-450',
  INTEGRAL = 'integral-550'
}

export const PLAN_METADATA: Record<PlanLevel, { name: string; price: number; features: string[] }> = {
  [PlanLevel.INICIAL]: {
    name: 'Plan Inicial',
    price: 0,
    features: ['Gestión de Clientes', 'Órdenes de Servicio', 'Portal Público']
  },
  [PlanLevel.PROFESIONAL]: {
    name: 'Plan Profesional',
    price: 350,
    features: ['Notas Privadas', 'Rastreo de IP (Seguridad)']
  },
  [PlanLevel.AVANZADO]: {
    name: 'Plan Avanzado',
    price: 450,
    features: ['Semáforo de 48h (Alertas)', 'Evidencia Fotográfica', 'PDF de Entrega']
  },
  [PlanLevel.INTEGRAL]: {
    name: 'Plan Integral',
    price: 550,
    features: ['Inventario / Stock', 'Flujo de Caja (Finanzas)']
  }
};

export const PLAN_HIERARCHY = [
  PlanLevel.INICIAL,
  PlanLevel.PROFESIONAL,
  PlanLevel.AVANZADO,
  PlanLevel.INTEGRAL
];

export interface Subscription {
  status: SubscriptionStatus;
  plan_code: PlanLevel;
  current_period_end: string;
  grace_until?: string;
}

export function isAccessGranted(sub: Subscription | null): boolean {
  if (!sub) return false;

  const now = new Date();
  const periodEnd = new Date(sub.current_period_end);
  const graceEnd = sub.grace_until ? new Date(sub.grace_until) : periodEnd;

  if (sub.status === 'active') {
    return true;
  }

  if (sub.status === 'trialing') {
    return now <= periodEnd;
  }

  if (sub.status === 'past_due') {
    return now <= graceEnd;
  }

  return false;
}

export function getSubscriptionAlert(sub: Subscription | null): string | null {
  if (!sub) return "No se encontró una suscripción activa.";

  if (sub.status === 'past_due') {
    return "⚠️ Tu pago está pendiente. Tienes un periodo de gracia para regularizarte.";
  }

  if (sub.status === 'suspended') {
    return "🚫 Servicio suspendido por falta de pago.";
  }

  return null;
}
