"use client";

import { readAuthToken, clearAuthToken } from "@/lib/auth-storage";

export type StoredUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  tenantId?: string;
  tenantSlug?: string;
  sucursalId?: string | null;
};

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(readAuthToken());
}

export function getStoredUser(): StoredUser | null {
  const token = readAuthToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  return {
    id: String(payload.sub ?? payload.user_id ?? ""),
    email: String(payload.email ?? ""),
    name: typeof payload.name === "string" ? payload.name : undefined,
    role: typeof payload.role === "string" ? payload.role : undefined,
    tenantId: typeof payload.tenant_id === "string" ? payload.tenant_id : undefined,
    tenantSlug: typeof payload.tenant_slug === "string" ? payload.tenant_slug : undefined,
    sucursalId: typeof payload.sucursal_id === "string" ? payload.sucursal_id : null,
  };
}

export function getStoredTenant() {
  const user = getStoredUser();
  return user ? { id: user.tenantId ?? "", slug: user.tenantSlug ?? "" } : null;
}

export function logout() {
  clearAuthToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

