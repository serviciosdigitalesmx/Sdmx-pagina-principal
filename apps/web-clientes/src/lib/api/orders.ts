import { apiClient } from "./client";
import type { BackendOrderResponse } from "../types";

export function getOrderByFolio(tenantSlug: string, folio: string) {
  return apiClient<BackendOrderResponse>(`/api/public/tenant/${encodeURIComponent(tenantSlug)}/orders/${encodeURIComponent(folio)}`);
}
