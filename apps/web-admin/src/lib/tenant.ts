"use client";

import { resolveApiBaseUrl } from "@white-label/config";
import { readAuthToken } from "@/lib/auth-storage";
import { getStoredUser } from "@/lib/auth";
import { getActiveScope, setActiveScope, type DashboardScope } from "@/lib/scope";

export function getTenantSlug() {
  return getStoredUser()?.tenantSlug ?? "";
}

export function getActiveSucursalId() {
  return getActiveScope()?.sucursalId ?? getStoredUser()?.sucursalId ?? null;
}

export function setActiveSucursalId(sucursalId: string | null) {
  const current = getActiveScope();
  if (!current) return;
  const nextScope: DashboardScope = {
    ...current,
    sucursalId,
    mode: sucursalId ? "branch" : "consolidated",
  };
  setActiveScope(nextScope);
}

export function canUseConsolidatedView() {
  const scope = getActiveScope();
  return scope?.role === "owner";
}

export function getApiOptions(): RequestInit {
  const token = readAuthToken();
  return {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(getActiveSucursalId() ? { "x-fixi-sucursal-id": String(getActiveSucursalId()), "x-sucursal-id": String(getActiveSucursalId()) } : {}),
    },
  };
}

export { resolveApiBaseUrl };
