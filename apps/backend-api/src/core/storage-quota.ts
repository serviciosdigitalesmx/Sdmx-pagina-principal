import { env } from "./env.js";
import { AppError } from "./http.js";
import { supabaseAdmin } from "./supabase.js";

export type StorageQuota = {
  usedBytes: number;
  limitBytes: number | null;
  percentUsed: number | null;
  warning: boolean;
  blocked: boolean;
};

function planStorageLimitBytes(limits: unknown): number | null {
  if (!limits || typeof limits !== "object") return null;
  const storageMb = Number((limits as Record<string, unknown>).storage_mb);
  if (!Number.isFinite(storageMb) || storageMb <= 0) return null;
  return Math.floor(storageMb * 1024 * 1024);
}

async function currentTenantQuota(tenantId: string) {
  const { data: subscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select("status, plan:plans(limits)")
    .eq("tenant_id", tenantId)
    .in("status", ["trialing", "active"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) throw new AppError(subscriptionError.message, 500, "subscription_lookup_failed");

  const limits = Array.isArray((subscription as { plan?: Array<Record<string, unknown>> | null }).plan)
    ? ((subscription as { plan?: Array<Record<string, unknown>> | null }).plan?.[0]?.limits ?? {})
    : ((subscription as { plan?: { limits?: unknown } | null }).plan?.limits ?? {});

  return planStorageLimitBytes(limits);
}

export async function getStorageQuota(tenantId: string): Promise<StorageQuota> {
  const [limitBytes, usageResult] = await Promise.all([
    currentTenantQuota(tenantId),
    supabaseAdmin.from("usage_counters").select("storage_bytes").eq("tenant_id", tenantId).maybeSingle()
  ]);

  if (usageResult.error) throw new AppError(usageResult.error.message, 500, "storage_usage_lookup_failed");

  const usedBytes = Number((usageResult.data as { storage_bytes?: number | null } | null)?.storage_bytes ?? 0);
  const percentUsed = limitBytes ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : null;

  return {
    usedBytes,
    limitBytes,
    percentUsed,
    warning: typeof percentUsed === "number" ? percentUsed >= 80 : false,
    blocked: typeof percentUsed === "number" ? percentUsed >= 100 : false
  };
}

export async function assertStorageQuota(tenantId: string, additionalBytes: number) {
  if (!Number.isFinite(additionalBytes) || additionalBytes < 0) {
    throw new AppError("Invalid storage size", 400, "invalid_storage_size");
  }

  const quota = await getStorageQuota(tenantId);
  if (quota.limitBytes === null) return quota;

  if (quota.usedBytes + additionalBytes > quota.limitBytes) {
    throw new AppError("Storage quota exceeded", 402, "storage_quota_exceeded");
  }

  return quota;
}

export async function addStorageUsage(tenantId: string, bytes: number) {
  const { error } = await supabaseAdmin.rpc("increment_storage_counter", {
    p_tenant_id: tenantId,
    p_bytes: Math.max(0, Math.floor(bytes))
  });

  if (error) throw new AppError(error.message, 500, "storage_increment_failed");
}

export async function getBillingStorageSummary(tenantId: string) {
  const quota = await getStorageQuota(tenantId);
  return {
    ...quota,
    usedMb: Number((quota.usedBytes / (1024 * 1024)).toFixed(2)),
    limitMb: quota.limitBytes ? Number((quota.limitBytes / (1024 * 1024)).toFixed(2)) : null,
    bucket: env.EVIDENCE_IMAGES_BUCKET ?? env.ORDER_DOCUMENTS_BUCKET ?? null
  };
}
