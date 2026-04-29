import { PlanCode } from '@sdmx/contracts';

export interface PlanLimits {
  maxServiceOrders: number;
  maxUsers: number;
  hasPrioritySupport: boolean;
  hasAdvancedReports: boolean;
}

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  basic: {
    maxServiceOrders: 50,
    maxUsers: 1,
    hasPrioritySupport: false,
    hasAdvancedReports: false
  },
  pro: {
    maxServiceOrders: 500,
    maxUsers: 5,
    hasPrioritySupport: true,
    hasAdvancedReports: false
  },
  enterprise: {
    maxServiceOrders: Infinity,
    maxUsers: Infinity,
    hasPrioritySupport: true,
    hasAdvancedReports: true
  }
};

export function enforcePlanLimits(plan: PlanCode, currentUsage: number, limitType: keyof PlanLimits): void {
  const limits = PLAN_LIMITS[plan];
  const limitValue = limits[limitType];
  
  if (typeof limitValue === 'number' && currentUsage >= limitValue) {
    throw new Error(`PLAN_LIMIT_REACHED: Límite excedido para el plan ${plan}. Por favor, actualiza tu plan.`);
  }
}
