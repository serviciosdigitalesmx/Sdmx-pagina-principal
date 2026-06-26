import { supabaseAdmin } from '@white-label/database';
import { writeAuditLog } from './security-backoffice';
import {
  assertTenantPlanLimit,
  getTenantLimitDiagnostics,
  listPlanDefinitions,
} from './tenant-plan-limits';

type TenantRow = {
  id: string;
  slug: string | null;
  name: string | null;
  billing_exempt: boolean | null;
  trial_expires_at?: string | null;
  created_at?: string | null;
  require_admin_mfa?: boolean | null;
};

type AuditRow = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  request_id?: string | null;
  data_after?: Record<string, unknown> | null;
  created_at: string;
};

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function clampLimit(value: unknown, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isMasterTenantSlug(slug: string | null | undefined) {
  const masterTenantSlug = normalize(process.env.MASTER_TENANT_SLUG);
  return Boolean(masterTenantSlug && normalize(slug) === masterTenantSlug);
}

function sanitizeSupportMetadata(dataAfter: Record<string, unknown> | null | undefined) {
  if (!dataAfter) return null;

  return {
    supportAction: dataAfter.supportAction === true,
    supportReason: typeof dataAfter.supportReason === 'string' ? dataAfter.supportReason : null,
    supportTicketId: typeof dataAfter.supportTicketId === 'string' ? dataAfter.supportTicketId : null,
    targetTenantId: typeof dataAfter.targetTenantId === 'string' ? dataAfter.targetTenantId : null,
    changedField: typeof dataAfter.changedField === 'string' ? dataAfter.changedField : null,
  };
}

export async function listPlatformTenants(params: { search?: string | null; limit?: unknown }) {
  const limit = clampLimit(params.limit);
  const search = String(params.search ?? '').trim();

  let query = supabaseAdmin
    .from('tenants')
    .select('id, slug, name, billing_exempt, trial_expires_at, created_at, require_admin_mfa')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (search) {
    const safeSearch = search.replace(/[%,]/g, ' ').trim();
    if (safeSearch) {
      query = query.or(`slug.ilike.%${safeSearch}%,name.ilike.%${safeSearch}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    tenants: ((data ?? []) as TenantRow[]).map((tenant) => ({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      billing_exempt: Boolean(tenant.billing_exempt),
      trial_ends_at: tenant.trial_expires_at ?? null,
      created_at: tenant.created_at ?? null,
      access_status: isMasterTenantSlug(tenant.slug)
        ? 'master'
        : tenant.billing_exempt
          ? 'billing_exempt'
          : 'standard',
    })),
    limit,
  };
}

export function listPlatformPlanDefinitions() {
  return listPlanDefinitions();
}

export async function getPlatformTenantLimitDiagnostics(params: { tenantId: string }) {
  return getTenantLimitDiagnostics(params);
}

export async function validatePlatformTenantPlanLimit(params: {
  tenantId: string;
  resource: 'users' | 'sucursales';
  increment?: number;
  requestId?: string | null;
}) {
  return assertTenantPlanLimit(params);
}

export async function getPlatformTenantAudit(params: { tenantId: string; limit?: unknown; action?: string | null }) {
  if (!isUuid(params.tenantId)) {
    throw new Error('tenantId must be a valid UUID');
  }

  const limit = clampLimit(params.limit);
  const action = String(params.action ?? '').trim();

  let query = supabaseAdmin
    .from('audit_logs')
    .select('id, tenant_id, user_id, action, request_id, data_after, created_at')
    .eq('tenant_id', params.tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (action) {
    query = query.eq('action', action);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    auditLogs: ((data ?? []) as AuditRow[]).map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      user_id: row.user_id,
      action: row.action,
      request_id: row.request_id ?? (typeof row.data_after?.requestId === 'string' ? row.data_after.requestId : null),
      created_at: row.created_at,
      support: sanitizeSupportMetadata(row.data_after),
    })),
    limit,
  };
}

export async function setTenantBillingExempt(params: {
  tenantId: string;
  billingExempt: boolean;
  supportReason: string;
  supportTicketId?: string | null;
  actorUserId?: string | null;
  actorTenantId: string;
  requestId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  if (!isUuid(params.tenantId)) {
    throw new Error('tenantId must be a valid UUID');
  }

  const supportReason = params.supportReason.trim();
  const supportTicketId = params.supportTicketId?.trim() || null;

  const { data: beforeRow, error: beforeError } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, billing_exempt')
    .eq('id', params.tenantId)
    .maybeSingle();

  if (beforeError) throw beforeError;
  if (!beforeRow) throw new Error('Tenant not found');
  if (isMasterTenantSlug(beforeRow.slug)) {
    throw new Error('Cannot mutate master tenant');
  }

  const beforeBillingExempt = Boolean(beforeRow.billing_exempt);

  const { error: updateError } = await supabaseAdmin
    .from('tenants')
    .update({ billing_exempt: params.billingExempt })
    .eq('id', params.tenantId);

  if (updateError) throw updateError;

  const { data: afterRow, error: afterError } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, billing_exempt')
    .eq('id', params.tenantId)
    .maybeSingle();

  if (afterError) throw afterError;

  try {
    await writeAuditLog({
      tenantId: params.actorTenantId,
      userId: params.actorUserId ?? null,
      action: 'platform_admin.tenant.billing_exempt.updated',
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      dataBefore: {
        targetTenantId: beforeRow.id,
        changedField: 'billing_exempt',
        before: beforeBillingExempt,
      },
      dataAfter: {
        supportAction: true,
        supportReason,
        supportTicketId,
        targetTenantId: beforeRow.id,
        changedField: 'billing_exempt',
        before: beforeBillingExempt,
        after: Boolean(afterRow?.billing_exempt ?? params.billingExempt),
        requestId: params.requestId,
      },
    });
  } catch (auditError) {
    await supabaseAdmin
      .from('tenants')
      .update({ billing_exempt: beforeBillingExempt })
      .eq('id', params.tenantId);
    throw auditError;
  }

  return {
    tenantId: beforeRow.id,
    billingExempt: Boolean(afterRow?.billing_exempt ?? params.billingExempt),
    requestId: params.requestId,
  };
}
