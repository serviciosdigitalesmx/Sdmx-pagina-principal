"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TenantProvider, type TenantConfig, useTenantTheme } from "@/components/tenant/tenant-provider";
import { ProtectedLink } from "@/components/guard/ProtectedLink";
import { useAuth } from "@/components/guard/use-auth";
import type { Role } from "@/components/guard/use-auth";
import { fixService } from "@/services/fixService";

export const ADMIN_BUILD_MARKER = "tenant-session-c323cf60";

type NavItem = {
  href: string;
  label: string;
  allowedRoles: Role[];
  moduleKey?: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Integrador",
    items: [
      { href: "/dashboard", label: "Resumen", allowedRoles: ["owner", "manager", "technician"] },
      { href: "/dashboard/ordenes", label: "Órdenes", allowedRoles: ["owner", "manager", "technician"], moduleKey: "orders" },
      { href: "/dashboard/archivo", label: "Archivo", allowedRoles: ["owner", "manager", "technician"], moduleKey: "orders" },
      { href: "/dashboard/solicitudes", label: "Solicitudes", allowedRoles: ["owner", "manager", "technician"], moduleKey: "requests" },
      { href: "/dashboard/landing", label: "Sitio del tenant", allowedRoles: ["owner", "manager"], moduleKey: "landing" },
    ],
  },
  {
    title: "Paneles",
    items: [
      { href: "/dashboard/clientes", label: "Clientes", allowedRoles: ["owner", "manager", "technician"], moduleKey: "customers" },
      { href: "/dashboard/proveedores", label: "Proveedores", allowedRoles: ["owner", "manager"], moduleKey: "suppliers" },
      { href: "/dashboard/stock", label: "Stock", allowedRoles: ["owner", "manager", "technician"], moduleKey: "stock" },
      { href: "/dashboard/tareas", label: "Tareas", allowedRoles: ["owner", "manager", "technician"], moduleKey: "tasks" },
    ],
  },
  {
    title: "Control",
    items: [
      { href: "/dashboard/compras", label: "Compras", allowedRoles: ["owner", "manager"], moduleKey: "purchase-orders" },
      { href: "/dashboard/gastos", label: "Gastos", allowedRoles: ["owner", "manager"], moduleKey: "expenses" },
      { href: "/dashboard/finanzas", label: "Finanzas", allowedRoles: ["owner", "manager"], moduleKey: "finance" },
      { href: "/dashboard/reportes", label: "Reportes", allowedRoles: ["owner", "manager"], moduleKey: "reports" },
      { href: "/dashboard/seguridad", label: "Seguridad", allowedRoles: ["owner", "manager"], moduleKey: "security" },
      { href: "/dashboard/sucursales", label: "Sucursales", allowedRoles: ["owner", "manager"], moduleKey: "sucursales" },
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
  const [sucursales, setSucursales] = React.useState<Array<{ id?: string; name?: string; city?: string; code?: string }>>([]);
  const [tenantConfig, setTenantConfig] = React.useState<{
    active_modules?: string[];
    labels?: Record<string, string>;
    status_labels?: Record<string, string>;
    capabilities?: {
      active_modules: string[];
      locked_modules: string[];
      plan_key: 'basic' | 'pro' | 'scale';
      access_status: 'active' | 'trial' | 'billing_exempt' | 'master' | 'blocked';
    };
  } | null>(null);
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
  const sucursalId = searchParams.get('sucursalId') ?? auth.sucursalId ?? '';
  const enabledModules = React.useMemo(() => {
    const activeModules = tenantConfig?.capabilities?.active_modules ?? tenantConfig?.active_modules;
    if (Array.isArray(activeModules) && activeModules.length > 0) {
      return new Set(activeModules);
    }
    return null;
  }, [tenantConfig?.active_modules, tenantConfig?.capabilities?.active_modules]);

  const visibleNavGroups = React.useMemo(() => {
    if (!enabledModules) {
      return navGroups;
    }

    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.moduleKey || item.href === '/dashboard' || enabledModules.has(item.moduleKey)),
      }))
      .filter((group) => group.items.length > 0);
  }, [enabledModules]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSucursales() {
      try {
        const data = await fixService.getSucursales();
        if (!cancelled) {
          setSucursales(data as Array<{ id?: string; name?: string; city?: string; code?: string }>);
        }
      } catch {
        if (!cancelled) setSucursales([]);
      }
    }

    void loadSucursales();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadTenantSettings() {
      try {
        const settings = await fixService.getTenantSettings();
        if (!cancelled) {
          setTenantConfig({
            active_modules: settings.data.tenant.active_modules ?? settings.data.config?.activeModules ?? [],
            labels: settings.data.tenant.labels ?? settings.data.config?.labels ?? {},
            status_labels: settings.data.tenant.status_labels ?? settings.data.config?.statusLabels ?? {},
            capabilities: settings.data.tenant.capabilities ?? settings.data.config?.capabilities ?? undefined,
          });
        }
      } catch {
        if (!cancelled) {
          setTenantConfig(null);
        }
      }
    }

    void loadTenantSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateSucursal(nextSucursalId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextSucursalId) {
      params.set('sucursalId', nextSucursalId);
    } else {
      params.delete('sucursalId');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div key={pathname} className="flex min-h-screen flex-col bg-[linear-gradient(180deg,#050505_0%,#0f0f10_46%,#141210_100%)] text-zinc-100 lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.98),rgba(14,13,12,0.96))] backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r">
        <div className="border-b border-amber-700/15 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-700/20 bg-[linear-gradient(180deg,rgba(124,45,18,0.26),rgba(15,23,42,0.96))] text-sm font-black text-amber-50 shadow-[0_14px_40px_rgba(0,0,0,0.24)]">
              {activeTenant.brandName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-zinc-50">{activeTenant.brandName}</div>
              <div className="text-xs text-zinc-400">{activeTenant.tenantName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {visibleNavGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/60">
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
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200",
                      pathname === item.href ||
                      (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                        ? "border border-amber-700/20 bg-amber-500/10 text-zinc-50 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                        : "text-zinc-400 hover:border hover:border-zinc-800 hover:bg-white/5 hover:text-zinc-50",
                    ].join(' ')}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-amber-700/15 p-4 text-sm text-zinc-400">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="text-zinc-50">{activeTenant.userEmail}</div>
            <div className="mt-1 text-xs text-zinc-400">Rol: {activeTenant.userRole}</div>
            <div className="text-xs text-zinc-400">Sucursal: {activeTenant.sucursalName}</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-amber-700/15 bg-[linear-gradient(180deg,rgba(14,13,12,0.96),rgba(16,14,12,0.90))] px-4 py-4 backdrop-blur-xl sm:items-center sm:px-6 sm:py-0 sm:h-16">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-50 [font-family:var(--font-display)]">SR FIX · Integrador Interno</div>
            <div className="text-xs leading-5 text-zinc-400">
              Tenant: {activeTenant.tenantId} · Rol: {activeTenant.userRole} · Sucursal: {activeTenant.sucursalName}
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/dashboard/landing" className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5">
              Configurar sitio
            </Link>
            <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-zinc-950" style={{ backgroundColor: theme.accent }}>
              {activeTenant.userEmail.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-700/15 bg-zinc-950/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:px-6">
          <span>BUILD: {ADMIN_BUILD_MARKER}</span>
          <div className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
            <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">Todas las sucursales</span>
            <select
              value={sucursalId}
              onChange={(event) => updateSucursal(event.target.value)}
              className="min-w-52 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">Todas / contexto actual</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id ?? sucursal.code ?? sucursal.name} value={sucursal.id ?? ''}>
                  {sucursal.name ?? 'Sucursal'}{sucursal.city ? ` · ${sucursal.city}` : ''}{sucursal.code ? ` (${sucursal.code})` : ''}
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
