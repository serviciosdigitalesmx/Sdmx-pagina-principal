import { getTenantLanding } from "../api/tenant";
import type { LandingContent, Tenant } from "../types";
import { resolveTenantContent } from "../content/content-resolver";

export type TenantLandingPayload = {
  tenant: Tenant;
  landingContent: LandingContent;
  contentIssues: Array<{ field: string; message: string }>;
};

export async function loadTenantLanding(tenantSlug: string): Promise<TenantLandingPayload | null> {
  const payload = await getTenantLanding(tenantSlug);

  if (!payload?.success) {
    return null;
  }

  const landingContent = payload.data?.landingContent;
  if (!landingContent || typeof landingContent !== "object") {
    return null;
  }

  const resolved = resolveTenantContent(payload.data.tenant, landingContent);
  if (!resolved) return null;

  return {
    tenant: payload.data.tenant,
    landingContent: resolved.content,
    contentIssues: resolved.issues,
  };
}
