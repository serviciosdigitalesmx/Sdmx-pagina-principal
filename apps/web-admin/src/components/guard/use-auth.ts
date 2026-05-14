"use client";

import { useMemo } from 'react';
import { useTenant } from '@/components/tenant/tenant-provider';

export type Role = 'owner' | 'manager' | 'technician';

export function useAuth() {
  const tenant = useTenant();

  return useMemo(
    () => ({
      role: tenant.userRole.toLowerCase() as Role,
      tenantId: tenant.tenantId,
      sucursalId: tenant.userSucursalId,
      userEmail: tenant.userEmail,
    }),
    [tenant]
  );
}
