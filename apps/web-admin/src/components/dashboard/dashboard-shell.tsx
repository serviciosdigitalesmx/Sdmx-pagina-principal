"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { TenantProvider, type TenantConfig, useTenantTheme } from '@/components/tenant/tenant-provider';
import { ProtectedLink } from '@/components/guard/ProtectedLink';
import type { Role } from '@/components/guard/use-auth';

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
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { href: '/dashboard/clientes', label: 'Clientes', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/proveedores', label: 'Proveedores', allowedRoles: ['owner', 'manager'] },
      { href: '/dashboard/stock', label: 'Inventario', allowedRoles: ['owner', 'manager', 'technician'] },
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
      { href: '/dashboard/tareas', label: 'Tareas', allowedRoles: ['owner', 'manager', 'technician'] },
      { href: '/dashboard/solicitudes', label: 'Solicitudes', allowedRoles: ['owner', 'manager', 'technician'] },
    ],
  },
  {
    title: 'Administración',
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

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      <aside className="w-72 shrink-0 border-r border-white/10 bg-slate-950/95 flex flex-col">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-slate-950"
              style={{ backgroundColor: theme.primary }}
            >
              SF
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">
                {tenant.brandName}
              </div>
              <div className="text-xs text-slate-400">{tenant.tenantName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
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
                      'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors',
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                        ? 'bg-slate-800 text-white shadow-lg shadow-black/20'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white',
                    ].join(' ')}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm text-slate-400">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-white">{tenant.userEmail}</div>
            <div className="mt-1 text-xs text-slate-500">Role: {tenant.userRole}</div>
            <div className="text-xs text-slate-500">Sucursal: {tenant.branchName}</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-white/10 bg-slate-950/70 px-6 backdrop-blur">
          <div>
            <div className="text-sm font-semibold text-white">Workspace activo</div>
            <div className="text-xs text-slate-400">Tenant actual: {tenant.tenantId}</div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-sm text-slate-400 transition-colors hover:text-white">
              Notificaciones
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-slate-950"
              style={{ backgroundColor: theme.accent }}
            >
              {tenant.userEmail.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-950 p-6">{children}</main>
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
