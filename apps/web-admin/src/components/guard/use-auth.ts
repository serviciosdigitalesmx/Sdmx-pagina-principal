"use client";

import { useEffect, useMemo, useState } from 'react';
import { useTenant } from '@/components/tenant/tenant-provider';
import { getCurrentSession } from '@/lib/session';
import { getActiveScope } from '@/lib/scope';

export type Role = 'owner' | 'manager' | 'technician' | 'client';

export type AuthState = {
  role: Role;
  tenantId: string;
  tenantSlug: string;
  sucursalId: string;
  userEmail: string;
  ready: boolean;
};

export function useAuth(): AuthState {
  const tenant = useTenant();
  const [session, setSession] = useState<ReturnType<typeof getCurrentSession> | null>(null);

  useEffect(() => {
    const sessionTimer = window.setTimeout(() => {
      setSession(getCurrentSession());
    }, 0);

    return () => {
      window.clearTimeout(sessionTimer);
    };
  }, []);

  return useMemo(() => {
    const activeScope = getActiveScope();
    const resolvedSucursalId = activeScope?.sucursalId ?? '';

    if (session) {
      return {
        role: (session.role || tenant.userRole).toLowerCase() as Role,
        tenantId: session.tenantId || tenant.tenantId,
        tenantSlug: session.tenantSlug,
        sucursalId: resolvedSucursalId,
        userEmail: session.email || tenant.userEmail,
        ready: true,
      } satisfies AuthState;
    }

    return {
      role: tenant.userRole.toLowerCase() as Role,
      tenantId: tenant.tenantId,
      tenantSlug: tenant.tenantId,
      sucursalId: resolvedSucursalId,
      userEmail: tenant.userEmail,
      ready: false,
    } satisfies AuthState;
  }, [session, tenant]);
}
