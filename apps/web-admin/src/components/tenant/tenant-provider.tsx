"use client";

import React, { createContext, useContext } from 'react';

export type TenantConfig = {
  tenantId: string;
  tenantName: string;
  brandName: string;
  sucursalName: string;
  userSucursalId: string;
  userEmail: string;
  userRole: string;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

type TenantContextValue = TenantConfig;

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  value,
  children,
}: {
  value: TenantConfig;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={value}>
      <div
        style={
          {
            '--tenant-primary': value.theme.primary,
            '--tenant-secondary': value.theme.secondary,
            '--tenant-accent': value.theme.accent,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

export function useTenantTheme() {
  const tenant = useTenant();

  return tenant.theme;
}
