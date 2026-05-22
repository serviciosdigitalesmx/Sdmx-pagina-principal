"use client";

import { useMemo } from 'react';
import { useTenant } from '@/components/tenant/tenant-provider';
import { readAuthToken } from '@/lib/auth-storage';

export type Role = 'owner' | 'manager' | 'technician';

function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const tenant = useTenant();

  return useMemo(() => {
    if (typeof window !== 'undefined') {
      const token = readAuthToken();
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
          return {
            role: (decoded.role || tenant.userRole).toLowerCase() as Role,
            tenantId: decoded.tenant_id || tenant.tenantId,
            sucursalId: decoded.sucursal_id || tenant.userSucursalId,
            userEmail: decoded.email || tenant.userEmail,
          };
        }
      }
    }

    return {
      role: tenant.userRole.toLowerCase() as Role,
      tenantId: tenant.tenantId,
      sucursalId: tenant.userSucursalId,
      userEmail: tenant.userEmail,
    };
  }, [tenant]);
}
