import { supabaseAdmin } from '@white-label/database';
import type { TenantCapabilities, TenantPlanLimits } from '@white-label/types';
import { loadTenantRuntimeConfig } from './tenant-config';
import { loadTenantBillingSummary } from './tenant-billing';
import { MODULE_REGISTRY, PLAN_REGISTRY, resolveTenantCapabilities } from './tenant-capabilities';

export type PlanLimitResource = Exclude<keyof TenantPlanLimits, 'public_portal'>;
export type PlanLimitStatus = 'ok' | 'exceeded' | 'unlimited' | 'unknown' | 'not_implemented';

export type PlanLimitDiagnostic = {
  key: PlanLimitResource;
  limit: number | null;
  used: number | null;
  remaining: number | null;
  status: PlanLimitStatus;
  reason?: string;
};

type TenantRow = {
  id: string;
  slug: string | null;
  name: string | null;
};

export type TenantLimitDiagnostics = {
  tenantId: string;
  tenantSlug: string | null;
  tenantName: string | null;
  planKey: TenantCapabilities['plan_key'];
  accessStatus: TenantCapabilities['access_status'];
  source: 'PLAN_REGISTRY';
  limits: PlanLimitDiagnostic[];
};

export class PlanLimitExceededError extends Error {
  statusCode = 403;
  code = 'PLAN_LIMIT_EXCEEDED';
  resource: PlanLimitResource;
  limit: number;
  used: number;
  requested: number;
  requestId: string | null;

  constructor(params: {
    resource: PlanLimitResource;
    limit: number;
    used: number;
    requested: number;
    requestId?: string | null;
  }) {
    super('Plan limit exceeded');
    this.name = 'PlanLimitExceededError';
    this.resource = params.resource;
    this.limit = params.limit;
    this.used = params.used;
    this.requested = params.requested;
    this.requestId = params.requestId ?? null;
  }
}

function isUuid(value: string | null | undefined) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function cloneLimits(limits: TenantPlanLimits): TenantPlanLimits {
  return {
    users: limits.users,
    sucursales: limits.sucursales,
    monthly_orders: limits.monthly_orders,
    storage_mb: limits.storage_mb,
    public_portal: limits.public_portal,
    whatsapp_templates: limits.whatsapp_templates,
    document_templates: limits.document_templates,
  };
}

function serializeLimit(resource: PlanLimitResource, limit: number | null, used: number | null, reason?: string): PlanLimitDiagnostic {
  if (limit === null) {
    return { key: resource, limit, used, remaining: null, status: 'unlimited', reason };
  }

  if (used === null) {
    return { key: resource, limit, used, remaining: null, status: reason === 'not_implemented' ? 'not_implemented' : 'unknown', reason };
  }

  const remaining = Math.max(limit - used, 0);
  return {
    key: resource,
    limit,
    used,
    remaining,
    status: used > limit ? 'exceeded' : 'ok',
    reason,
  };
}

async function countRows(table: string, tenantId: string, apply?: (query: any) => any) {
  let query = supabaseAdmin
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (apply) {
    query = apply(query);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

async function loadTenantCapabilitiesForDiagnostics(tenantId: string) {
  const { data: tenant, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) throw error;
  if (!tenant) throw new Error('Tenant not found');

  const runtimeConfig = await loadTenantRuntimeConfig(tenantId);
  const billing = await loadTenantBillingSummary(tenantId, tenant.slug);
  const capabilities = resolveTenantCapabilities({
    tenantId,
    tenantSlug: tenant.slug,
    tenantEmail: null,
    billing,
    runtimeConfig,
  });

  return { tenant: tenant as TenantRow, capabilities };
}

export function listPlanDefinitions() {
  return {
    source: 'PLAN_REGISTRY' as const,
    plans: (Object.entries(PLAN_REGISTRY) as Array<[TenantCapabilities['plan_key'], typeof PLAN_REGISTRY[TenantCapabilities['plan_key']]]>).map(([key, plan]) => ({
      key,
      name: key === 'basic' ? 'Basic' : key === 'pro' ? 'Pro' : 'Scale',
      limits: cloneLimits(plan.limits),
      modules: [...plan.module_allowlist],
      features: {
        public_portal: plan.limits.public_portal,
        module_count: plan.module_allowlist.length,
        modules: MODULE_REGISTRY
          .filter((module) => plan.module_allowlist.includes(module.key))
          .map((module) => ({
            key: module.key,
            label: module.label,
            category: module.category,
          })),
      },
    })),
  };
}

export async function getTenantLimitDiagnostics(params: { tenantId: string }): Promise<TenantLimitDiagnostics> {
  if (!isUuid(params.tenantId)) {
    throw new Error('tenantId must be a valid UUID');
  }

  const { tenant, capabilities } = await loadTenantCapabilitiesForDiagnostics(params.tenantId);
  const limits = capabilities.limits;
  const { start, end } = currentMonthRange();

  const [users, sucursales, monthlyOrders] = await Promise.all([
    countRows('users', params.tenantId, (query) => query.eq('is_active', true)),
    countRows('sucursales', params.tenantId),
    countRows('service_orders', params.tenantId, (query) => query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString())),
  ]);

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    planKey: capabilities.plan_key,
    accessStatus: capabilities.access_status,
    source: 'PLAN_REGISTRY',
    limits: [
      serializeLimit('users', limits.users, users),
      serializeLimit('sucursales', limits.sucursales, sucursales),
      serializeLimit('monthly_orders', limits.monthly_orders, monthlyOrders, 'live_count_current_month_no_atomic_counter'),
      serializeLimit('storage_mb', limits.storage_mb, null, 'No reliable tenant-wide storage size column found'),
      serializeLimit('whatsapp_templates', limits.whatsapp_templates, null, 'not_implemented'),
      serializeLimit('document_templates', limits.document_templates, null, 'not_implemented'),
    ],
  };
}

export async function assertTenantPlanLimit(params: {
  tenantId: string;
  resource: 'users' | 'sucursales';
  increment?: number;
  requestId?: string | null;
}) {
  const increment = Math.max(Math.trunc(Number(params.increment ?? 1)), 1);
  const diagnostics = await getTenantLimitDiagnostics({ tenantId: params.tenantId });

  if (diagnostics.accessStatus === 'master') {
    return {
      allowed: true,
      resource: params.resource,
      requestId: params.requestId ?? null,
      reason: 'master_access',
    };
  }

  const limit = diagnostics.limits.find((item) => item.key === params.resource);
  if (!limit) {
    throw new Error(`Unsupported plan limit resource: ${params.resource}`);
  }

  if (limit.limit === null || limit.status === 'unlimited') {
    return {
      allowed: true,
      resource: params.resource,
      requestId: params.requestId ?? null,
      limit: null,
      used: limit.used,
      requested: increment,
    };
  }

  const used = limit.used ?? 0;
  if (used + increment > limit.limit) {
    throw new PlanLimitExceededError({
      resource: params.resource,
      limit: limit.limit,
      used,
      requested: increment,
      requestId: params.requestId ?? null,
    });
  }

  return {
    allowed: true,
    resource: params.resource,
    requestId: params.requestId ?? null,
    limit: limit.limit,
    used,
    requested: increment,
    remaining: Math.max(limit.limit - used - increment, 0),
  };
}
