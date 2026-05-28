import React from 'react';
import { headers } from 'next/headers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { requireEnv } from '@white-label/config';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  let tenantId = requireEnv('NEXT_PUBLIC_DEFAULT_TENANT_ID');
  if (host && host.includes('.') && !host.includes('localhost') && !host.includes('vercel.app')) {
    const sub = host.split('.')[0];
    if (sub !== 'app') {
      tenantId = sub;
    }
  }

  const tenant = {
    tenantId,
    tenantName: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
    brandName: requireEnv('NEXT_PUBLIC_TENANT_BRAND_NAME'),
    sucursalName: requireEnv('NEXT_PUBLIC_DEFAULT_SUCURSAL_NAME'),
    userEmail: requireEnv('NEXT_PUBLIC_DEFAULT_USER_EMAIL'),
    userSucursalId: requireEnv('NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID'),
    userRole: requireEnv('NEXT_PUBLIC_DEFAULT_USER_ROLE').toLowerCase(),
    theme: {
      primary: requireEnv('NEXT_PUBLIC_THEME_PRIMARY'),
      secondary: requireEnv('NEXT_PUBLIC_THEME_SECONDARY'),
      accent: requireEnv('NEXT_PUBLIC_THEME_ACCENT'),
    },
  };

  return <DashboardShell tenant={tenant}>{children}</DashboardShell>;
}
