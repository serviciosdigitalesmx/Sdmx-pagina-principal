"use client";

type TenantSubject = {
  tenant_id?: string;
  app_metadata?: { tenant_id?: string };
};

export function tenantIdFromAuthUser(user?: TenantSubject | null): string {
  return String(user?.app_metadata?.tenant_id || user?.tenant_id || "");
}
