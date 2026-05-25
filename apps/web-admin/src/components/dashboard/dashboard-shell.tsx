"use client";

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TenantProvider, type TenantConfig, useTenantTheme } from '@/components/tenant/tenant-provider';
import { ProtectedLink } from '@/components/guard/ProtectedLink';
import { useAuth } from '@/components/guard/use-auth';
import type { Role } from '@/components/guard/use-auth';
import { fixService } from '@/services/fixService';

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
      { href: '/dashboard/landing', label: 'Landing', allowedRoles: ['owner', 'manager'] },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTenantTheme();
  const auth = useAuth();
  const [branches, setBranches] = React.useState<Array<{ id?: string; name?: string; city?: string; code?: string }>>([]);
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
  const branchId = searchParams.get('branchId') ?? auth.sucursalId ?? '';

  React.useEffect(() => {
    let cancelled = false;

    async function loadBranches() {
      try {
        const data = await fixService.getBranches();
        if (!cancelled) {
          setBranches(data as Array<{ id?: string; name?: string; city?: string; code?: string }>);
        }
      } catch {
        if (!cancelled) setBranches([]);
      }
    }

    void loadBranches();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateBranch(nextBranchId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextBranchId) {
      params.set('branchId', nextBranchId);
    } else {
      params.delete('branchId');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div key={pathname} className="flex min-h-screen flex-col text-zinc-100 bg-transparent lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-zinc-800 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-400/20 bg-[linear-gradient(180deg,rgba(168,85,247,0.22),rgba(9,14,28,0.96))] text-sm font-black text-slate-100"
            >
              {activeTenant.brandName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-zinc-50">
                {activeTenant.brandName}
              </div>
              <div className="text-xs text-zinc-400">{activeTenant.tenantName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3 sm:p-4">
          {navGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
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
                        ? 'border border-slate-400/20 bg-slate-400/10 text-zinc-50 shadow-[0_10px_30px_rgba(0,0,0,0.18)]'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-50 hover:border hover:border-zinc-800',
                    ].join(' ')}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-zinc-800 p-4 text-sm text-zinc-400">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="text-zinc-50">{activeTenant.userEmail}</div>
            <div className="mt-1 text-xs text-zinc-400">Rol: {activeTenant.userRole}</div>
            <div className="text-xs text-zinc-400">Sucursal: {activeTenant.branchName}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 bg-zinc-950/70 px-4 py-4 backdrop-blur-xl sm:items-center sm:px-6 sm:py-0 sm:h-16">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-50 [font-family:var(--font-display)]">Workspace activo</div>
            <div className="text-xs text-zinc-400 leading-5">
              Tenant: {activeTenant.tenantId} · Rol: {activeTenant.userRole} · Sucursal: {activeTenant.branchName}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button className="text-sm text-zinc-400 transition-colors hover:text-zinc-100">
              Notificaciones
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-zinc-950"
              style={{ backgroundColor: theme.accent }}
            >
              {activeTenant.userEmail.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:px-6">
          <span>BUILD: {ADMIN_BUILD_MARKER}</span>
          <div className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Sucursal</span>
            <select
              value={branchId}
              onChange={(event) => updateBranch(event.target.value)}
              className="min-w-52 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Todas / contexto actual</option>
              {branches.map((branch) => (
                <option key={branch.id ?? branch.code ?? branch.name} value={branch.id ?? ''}>
                  {branch.name ?? 'Sucursal'}{branch.city ? ` · ${branch.city}` : ''}{branch.code ? ` (${branch.code})` : ''}
                </option>
              ))}
            </select>
          </div>
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
