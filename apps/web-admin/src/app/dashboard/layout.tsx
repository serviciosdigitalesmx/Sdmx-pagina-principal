import React from 'react';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const tenant = {
  tenantId: process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? 'tenant-local',
  tenantName: process.env.NEXT_PUBLIC_DEFAULT_TENANT_NAME ?? 'Taller',
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Marca del taller',
  branchName: process.env.NEXT_PUBLIC_DEFAULT_BRANCH_NAME ?? 'Matriz',
  userEmail: process.env.NEXT_PUBLIC_DEFAULT_USER_EMAIL ?? 'admin@taller.com',
  userSucursalId: process.env.NEXT_PUBLIC_DEFAULT_USER_SUCURSAL_ID ?? 'sucursal-local',
  userRole: (process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE ?? 'owner').toLowerCase(),
  theme: {
    primary: process.env.NEXT_PUBLIC_THEME_PRIMARY ?? '#22d3ee',
    secondary: process.env.NEXT_PUBLIC_THEME_SECONDARY ?? '#0f172a',
    accent: process.env.NEXT_PUBLIC_THEME_ACCENT ?? '#34d399',
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell tenant={tenant}>{children}</DashboardShell>;
}
