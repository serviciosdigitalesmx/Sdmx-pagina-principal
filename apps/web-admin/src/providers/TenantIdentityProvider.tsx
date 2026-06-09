'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, getStoredTenant } from '@/lib/auth';
import { getActiveSucursalId, getApiOptions } from '@/lib/tenant';
import { apiClient } from '@/lib/api-client';
import type { TenantIdentity } from '@/domain/tenant/Identity';
import type { Sucursal } from '@/types';

type TenantIdentityContextValue = {
  identity: TenantIdentity | null;
  isLoading: boolean;
};

const TenantIdentityContext = createContext<TenantIdentityContextValue>({
  identity: null,
  isLoading: true,
});

export function TenantIdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<TenantIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadIdentity() {
      try {
        const tenant = getStoredTenant();
        const activeSucursalId = getActiveSucursalId();
        
        let branchName = 'Todas las sucursales';
        let branchCode = 'GLOBAL';

        if (activeSucursalId && activeSucursalId !== 'GLOBAL') {
          // Fetch sucursales to get the name of the active one
          // Ideally, the active sucursal details should be stored alongside the ID
          const data = await apiClient.get<{ data: Sucursal[] }>('/sucursales', getApiOptions());
          const sucursales = data.data || [];
          const activeSucursal = sucursales.find(s => s.id === activeSucursalId);
          
          if (activeSucursal) {
            branchName = activeSucursal.name;
            branchCode = activeSucursal.code || activeSucursal.name.substring(0, 3).toUpperCase();
          }
        }

        setIdentity({
          tenantName: tenant?.name || tenant?.slug || 'Negocio',
          branchName,
          branchCode,
        });
      } catch (error) {
        console.error('Failed to load tenant identity:', error);
        // Fallback
        const tenant = getStoredTenant();
        setIdentity({
          tenantName: tenant?.name || tenant?.slug || 'Negocio',
          branchName: 'Sucursal',
          branchCode: '',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadIdentity();
  }, []);

  return (
    <TenantIdentityContext.Provider value={{ identity, isLoading }}>
      {children}
    </TenantIdentityContext.Provider>
  );
}

export function useTenantIdentity() {
  return useContext(TenantIdentityContext);
}
