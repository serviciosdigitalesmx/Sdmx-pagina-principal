"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { TenantProvider, type TenantConfig, useTenantTheme } from '@/components/tenant/tenant-provider';
import { ProtectedLink } from '@/components/guard/ProtectedLink';
import { useAuth } from '@/components/guard/use-auth';
import type { Role } from '@/components/guard/use-auth';

export const ADMIN_BUILD_MARKER = "tenant-session-c323cf60";

type NavItem = {
  href: string;
  label: string;
  allowedRoles: Role[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/ordenes', label: 'Órdenes', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/archivo', label: 'Archivo', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/solicitudes', label: 'Solicitudes', allowedRoles: ['owner', 'manager', 'technician'] },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { href: '/dashboard/clientes', label: 'Clientes', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/proveedores', label: 'Proveedores', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/stock', label: 'Inventario', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/tareas', label: 'Tareas', allowedRoles: ['owner', 'manager', 'technician'] },
    ],
  },
  {
    title: 'Finanzas',
    items: [
      { href: '/dashboard/compras', label: 'Compras', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/gastos', label: 'Gastos', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/finanzas', label: 'Reporte financiero', allowedRoles: ['owner', 'manager'] },
    ],
  },
  {
    title: 'Operación',
    items: [
      { href: '/dashboard/reportes', label: 'Reportes', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/sucursales', label: 'Sucursales', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/seguridad', label: 'Seguridad', allowedRoles: ['owner', 'manager'] },
    ],
  },
];

function DashboardShellContent({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: TenantConfig;
}) {
  const pathname = usePathname();
  const theme = useTenantTheme();
  const auth = useAuth();
  const activeTenant = React.useMemo<TenantConfig>(() => {
    const tenantLabel = auth.tenantSlug || tenant.tenantId;

    return {
      ...tenant,
      tenantId: tenantLabel,
      tenantName: tenantLabel.charAt(0).toUpperCase() + tenantLabel.slice(1),
      userEmail: auth.userEmail || tenant.userEmail,
      userRole: auth.role || tenant.userRole,
    };
  }, [auth.role, auth.tenantSlug, auth.userEmail, tenant]);

  return (
    <div key={pathname} className="flex min-h-screen flex-col text-slate-900 bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-white/95 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2c6e9f]/20 bg-[linear-gradient(180deg,rgba(44,110,159,0.18),rgba(255,255,255,0.96))] text-sm font-black text-slate-900"
            >
              {activeTenant.brandName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-950">
                {activeTenant.brandName}
              </div>
              <div className="text-xs text-slate-500">{activeTenant.tenantName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3 sm:p-4">
          {navGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <ProtectedLink
                    key={item.href}
                    to={item.href}
                    label={item.label}
                    allowedRoles={item.allowedRoles}
                    className={[
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200',
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                        ? 'border border-[#2c6e9f]/20 bg-[#2c6e9f]/10 text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950 hover:border hover:border-slate-200',
                    ].join(' ')}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-sm text-slate-500">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-slate-950">{activeTenant.userEmail}</div>
            <div className="mt-1 text-xs text-slate-500">Rol: {activeTenant.userRole}</div>
            <div className="text-xs text-slate-500">Sucursal: {activeTenant.branchName}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-xl sm:items-center sm:px-6 sm:py-0 sm:h-16">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-950 [font-family:var(--font-display)]">Workspace activo</div>
            <div className="text-xs text-slate-500 leading-5">
              Tenant: {activeTenant.tenantId} · Rol: {activeTenant.userRole} · Sucursal: {activeTenant.branchName}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="text-sm text-slate-500 transition-colors hover:text-slate-900">
              Notificaciones
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-slate-950"
              style={{ backgroundColor: theme.accent }}
            >
              {activeTenant.userEmail.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 sm:px-6">
          BUILD: {ADMIN_BUILD_MARKER}
        </div>
        <main className="flex-1 overflow-auto bg-transparent p-6">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: TenantConfig;
}) {
  return (
    <TenantProvider value={tenant}>
      <DashboardShellContent tenant={tenant}>{children}</DashboardShellContent>
    </TenantProvider>
  );
}
