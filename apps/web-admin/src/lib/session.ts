"use client";

import { readAuthToken } from "@/lib/auth-storage";

export type CurrentSession = {
  token: string;
  email: string;
  role: string;
  tenantId: string;
  tenantSlug: string;
  sucursalId?: string;
};

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCurrentSession(): CurrentSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const token = readAuthToken();

  if (!token) {
    return null;
  }

  const decoded = decodeJwtPayload(token);

  if (!decoded) {
    return null;
  }

  const tenantSlug = typeof decoded.tenant_slug === "string" ? decoded.tenant_slug.trim() : "";
  const tenantId = typeof decoded.tenant_id === "string" ? decoded.tenant_id.trim() : "";
  const email = typeof decoded.email === "string" ? decoded.email.trim() : "";
  const role = typeof decoded.role === "string" ? decoded.role.trim() : "";
  const sucursalId = typeof decoded.sucursal_id === "string" ? decoded.sucursal_id.trim() : "";

  if (!tenantSlug) {
    return null;
  }

  return {
    token,
    email,
    role,
    tenantId,
    tenantSlug,
    sucursalId: sucursalId || undefined,
  };
}
