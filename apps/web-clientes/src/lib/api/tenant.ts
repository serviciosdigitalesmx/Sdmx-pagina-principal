import { apiClient } from "./client";
import type { LandingResponse } from "../types";

export function getTenantLanding(tenantSlug: string) {
  return apiClient<LandingResponse>(`/api/public/tenant/${encodeURIComponent(tenantSlug)}/landing`);
}
