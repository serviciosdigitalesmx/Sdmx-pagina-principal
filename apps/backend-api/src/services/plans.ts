// plans.ts - versión sin límites
import { PlanCode } from '@sdmx/contracts';

export interface PlanLimits {
  maxServiceOrders: number;
  maxUsers: number;
  hasPrioritySupport: boolean;
  hasAdvancedReports: boolean;
}

export const PLAN_LIMITS: Record<PlanCode, PlanLimits> = {
  basic: { maxServiceOrders: Infinity, maxUsers: Infinity, hasPrioritySupport: false, hasAdvancedReports: false },
  pro: { maxServiceOrders: Infinity, maxUsers: Infinity, hasPrioritySupport: true, hasAdvancedReports: false },
  enterprise: { maxServiceOrders: Infinity, maxUsers: Infinity, hasPrioritySupport: true, hasAdvancedReports: true }
};

export function enforcePlanLimits(plan: PlanCode, currentUsage: number, limitType: keyof PlanLimits): void {
  // No hacer nada, permitir siempre
  return;
}
