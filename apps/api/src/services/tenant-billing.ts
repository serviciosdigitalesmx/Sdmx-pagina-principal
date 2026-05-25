import { supabaseAdmin } from '@white-label/database';

export type TenantBillingSummary = {
  tenantId: string;
  tenantSlug: string;
  subscriptionStatus: string;
  trialExpiresAt: string | null;
  billingExempt: boolean;
  isTrialActive: boolean;
  isBillingBlocked: boolean;
  daysLeft: number | null;
  upgradeHref: string | null;
};

function computeDaysLeft(trialExpiresAt: string | null) {
  if (!trialExpiresAt) {
    return null;
  }

  const expiresAt = new Date(trialExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return null;
  }

  const diffMs = expiresAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export async function loadTenantBillingSummary(tenantId: string, tenantSlug?: string | null): Promise<TenantBillingSummary> {
  const [{ data: tenantRow, error: tenantError }, { data: organizationRow, error: orgError }] = await Promise.all([
    supabaseAdmin
      .from('tenants')
      .select('id, slug, trial_expires_at, billing_exempt')
      .eq('id', tenantId)
      .maybeSingle(),
    supabaseAdmin
      .from('organizations')
      .select('id, slug, subscription_status')
      .eq('id', tenantId)
      .maybeSingle(),
  ]);

  if (tenantError) {
    throw tenantError;
  }

  const resolvedTenantSlug = tenantSlug ?? tenantRow?.slug ?? organizationRow?.slug ?? null;
  const trialExpiresAt = tenantRow?.trial_expires_at ?? null;
  const billingExempt = Boolean(tenantRow?.billing_exempt);
  const subscriptionStatus = String(!orgError ? organizationRow?.subscription_status : 'trial').trim() || 'trial';
  const daysLeft = computeDaysLeft(trialExpiresAt ? new Date(trialExpiresAt).toISOString() : null);
  const isTrialActive = subscriptionStatus === 'trial' && daysLeft !== null && daysLeft > 0;
  const isBillingBlocked = !billingExempt && subscriptionStatus !== 'active' && (!isTrialActive || daysLeft === 0);
  const upgradeBaseUrl = process.env.APP_URL?.trim() || process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()).find(Boolean) || null;
  const upgradeHref = upgradeBaseUrl ? new URL('/onboarding', upgradeBaseUrl).toString() : null;

  return {
    tenantId,
    tenantSlug: resolvedTenantSlug ?? '',
    subscriptionStatus,
    trialExpiresAt: trialExpiresAt ? new Date(trialExpiresAt).toISOString() : null,
    billingExempt,
    isTrialActive,
    isBillingBlocked,
    daysLeft,
    upgradeHref,
  };
}
