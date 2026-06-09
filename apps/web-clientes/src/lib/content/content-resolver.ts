import type { LandingContent, Tenant } from "../types";
import { normalizeLandingContent, validateLandingContent } from "./content-validator";

export type ResolvedTenantContent = {
  tenantSlug: string;
  tenantName: string;
  content: LandingContent;
  issues: Array<{ field: string; message: string }>;
};

export function resolveTenantContent(tenant: Tenant, landingContent: unknown): ResolvedTenantContent | null {
  const normalized = normalizeLandingContent(landingContent, tenant.name, tenant.slug);
  if (!normalized) return null;

  const issues = validateLandingContent(landingContent);

  return {
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    content: normalized,
    issues,
  };
}
