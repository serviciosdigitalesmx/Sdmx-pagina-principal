import React from 'react';
import { headers } from 'next/headers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  let tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'taller';
  if (host && host.includes('.') && !host.includes('localhost') && !host.includes('vercel.app')) {
    const sub = host.split('.')[0];
    if (sub !== 'app') {
      tenantId = sub;
    }
  }

  const tenant = {
    tenantId,
    tenantName: tenantId.charAt(0).toUpperCase() + tenantId.slice(1),
    brandName: process.env.NEXT_PUBLIC_TENANT_BRAND_NAME ?? 'Marca del taller',
    branchName: process.env.NEXT_PUBLIC_DEFAULT_BRANCH_NAME ?? 'Matriz',
    userEmail: process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL ?? 'admin@taller.com',
    userSucursalId: process.env.NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID ?? 'sucursal-local',
    userRole: (process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE ?? 'owner').toLowerCase(),
    theme: {
      primary: process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#334155',
      secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#1f2937',
      accent: process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#475569',
    },
  };

  return <DashboardShell tenant={tenant}>{children}</DashboardShell>;
}
