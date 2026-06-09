import { apiClient } from "./client";

export type PublicQuoteRequest = {
  tenantSlug: string;
  fullName: string;
  phone: string;
  email?: string;
  deviceBrand: string;
  deviceModel: string;
  issue: string;
  deviceType?: string;
  serialNumber?: string;
  priorityLevel?: string;
  passwordOrPin?: string;
  metadata?: Record<string, unknown>;
};

export type PublicQuoteResponse = {
  success: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  data: {
    id: string;
    folio?: string;
    status?: string;
  };
};

export function submitPublicQuote(payload: PublicQuoteRequest) {
  return apiClient<PublicQuoteResponse>("/api/public/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
