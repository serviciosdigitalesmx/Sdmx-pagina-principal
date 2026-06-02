"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TenantProvider, type TenantConfig, useTenantTheme } from "@/components/tenant/tenant-provider";
import { ProtectedLink } from "@/components/guard/ProtectedLink";
import { useAuth } from "@/components/guard/use-auth";
import type { Role } from "@/components/guard/use-auth";
import { fixService } from "@/services/fixService";
import { getActiveScope, resolveDashboardScope, setActiveScope } from "@/lib/scope";
import { getModuleByRoute, getModuleStatusCounts } from "@/lib/module-catalog";
import { readAuthToken } from "@/lib/auth-storage";
import { resolveApiBaseUrl } from "@white-label/config";
import { useToast, Badge } from "@white-label/ui";

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
      { href: "/dashboard/archivo", label: "Archivo", allowedRoles: ["owner", "manager", "technician"], moduleKey: "archivo" },
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
      { href: "/dashboard/usuarios", label: "Usuarios", allowedRoles: ["owner", "manager"], moduleKey: "users" },
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
  const { pushToast } = useToast();
  const [sucursales, setSucursales] = React.useState<Array<{ id?: string; name?: string; city?: string; code?: string }>>([]);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
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
  const currentScope = getActiveScope();
  const dashboardScope = React.useMemo(() => {
    const bootstrapSucursalId = currentScope?.sucursalId ?? searchParams.get('sucursalId');
    return resolveDashboardScope({
      role: auth.role,
      tenantId: auth.tenantId,
      tenantSlug: auth.tenantSlug || auth.tenantId,
      querySucursalId: bootstrapSucursalId,
      sessionSucursalId: auth.sucursalId,
    });
  }, [auth.role, auth.sucursalId, auth.tenantId, auth.tenantSlug, currentScope?.sucursalId, searchParams]);
  const sucursalId = dashboardScope.sucursalId ?? '';
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

  const moduleStatusCounts = React.useMemo(() => getModuleStatusCounts(), []);

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
    setActiveScope(dashboardScope);
    return () => setActiveScope(null);
  }, [dashboardScope]);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

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
    const nextScope = resolveDashboardScope({
      role: auth.role,
      tenantId: auth.tenantId,
      tenantSlug: auth.tenantSlug || auth.tenantId,
      querySucursalId: nextSucursalId || null,
      sessionSucursalId: auth.sucursalId,
    });
    setActiveScope(nextScope);
    const params = new URLSearchParams(searchParams.toString());
    if (nextSucursalId) {
      params.set('sucursalId', nextSucursalId);
    } else {
      params.delete('sucursalId');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  async function enablePushNotifications() {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      pushToast({
        tone: "error",
        title: "Push no disponible",
        description: "Este navegador no soporta notificaciones push.",
      });
      return;
    }

    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") {
      return;
    }

    const token = readAuthToken();
    if (!token) {
      pushToast({
        tone: "error",
        title: "Sin sesión",
        description: "No hay sesión activa.",
      });
      return;
    }

    const apiBaseUrl = resolveApiBaseUrl();
    const vapidResponse = await fetch(`${apiBaseUrl}/api/${encodeURIComponent(activeTenant.tenantId)}/pwa/push/vapid`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!vapidResponse.ok) {
      pushToast({
        tone: "error",
        title: "No se pudo activar push",
        description: "No fue posible cargar la llave pública de notificaciones.",
      });
      return;
    }

    const vapidPayload = (await vapidResponse.json().catch(() => null)) as { success?: boolean; data?: { publicKey?: string } } | null;
    const publicKey = vapidPayload?.data?.publicKey;
    if (!publicKey) {
      pushToast({
        tone: "error",
        title: "Llave pública ausente",
        description: "La llave pública de notificaciones no está disponible.",
      });
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    const subscriptionJson = subscription.toJSON();
    if (!subscriptionJson.keys) {
      pushToast({
        tone: "error",
        title: "Suscripción inválida",
        description: "No se pudo leer la suscripción push.",
      });
      return;
    }

    await fetch(`${apiBaseUrl}/api/${encodeURIComponent(activeTenant.tenantId)}/pwa/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subscriptionJson.keys,
        deviceLabel: navigator.userAgent,
      }),
    });

    pushToast({
      tone: "success",
      title: "Push activado",
      description: "Notificaciones push activadas.",
    });
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <div key={pathname} className="flex min-h-screen flex-col bg-bg-dark text-text-primary-dark lg:flex-row">
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <aside
        id="dashboard-mobile-nav"
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-[260px] max-w-[86vw] shrink-0 flex-col border-b border-border-dark bg-bg-dark transition-transform duration-200 will-change-transform lg:static lg:z-auto lg:w-[260px] lg:max-w-none lg:border-b-0 lg:border-r",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="border-b border-border-dark p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              {activeTenant.brandName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-text-primary-dark">{activeTenant.brandName}</div>
              <div className="text-xs text-text-secondary-dark">{activeTenant.tenantName}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-4">
          {visibleNavGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div className="px-3 text-xs font-semibold uppercase tracking-wider text-text-secondary-dark">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const moduleInfo = getModuleByRoute(item.href);
                  const badge =
                    moduleInfo?.deliveryStatus === "ready"
                      ? "Listo"
                      : moduleInfo?.deliveryStatus === "partial"
                        ? "Parcial"
                        : moduleInfo?.deliveryStatus === "pending"
                          ? "Pendiente"
                          : undefined;

                  return (
                    <ProtectedLink
                      key={item.href}
                      to={item.href}
                      label={item.label}
                      allowedRoles={item.allowedRoles}
                      badge={badge}
                      className={[
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 touch-manipulation",
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname?.startsWith(item.href))
                          ? "bg-active/10 text-active font-medium"
                          : "text-text-secondary-dark hover:bg-white/5 hover:text-text-primary-dark",
                      ].join(' ')}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <div className="border-t border-border-dark p-4 text-sm">
          <div className="rounded-xl border border-border-dark bg-bg-dark p-4">
            <div className="font-medium text-text-primary-dark">{activeTenant.userEmail}</div>
            <div className="mt-1 text-xs text-text-secondary-dark">Rol: {activeTenant.userRole}</div>
            <div className="text-xs text-text-secondary-dark">Sucursal: {activeTenant.sucursalName}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="success" className="flex-1 justify-center">{moduleStatusCounts.ready} Listos</Badge>
              <Badge variant="warning" className="flex-1 justify-center">{moduleStatusCounts.partial} Parc.</Badge>
              <Badge variant="info" className="flex-1 justify-center">{moduleStatusCounts.pending} Pend.</Badge>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-border-dark bg-bg-dark px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <div className="text-base font-semibold text-text-primary-dark">SR FIX · Integrador Interno</div>
            <div className="text-xs text-text-secondary-dark mt-0.5">
              Tenant: {activeTenant.tenantId} · Rol: {activeTenant.userRole} · Sucursal: {activeTenant.sucursalName}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((current) => !current)}
              className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-border-dark bg-transparent text-text-primary-dark transition hover:bg-white/5 active:scale-95 lg:hidden"
              aria-label="Abrir menú"
              aria-expanded={mobileNavOpen}
              aria-controls="dashboard-mobile-nav"
            >
              ☰
            </button>
            <Link href="/dashboard/landing" className="hidden sm:inline-flex min-h-10 items-center rounded-lg border border-border-dark px-4 py-2 text-sm font-medium text-text-primary-dark transition hover:bg-white/5 active:scale-95">
              Configurar sitio
            </Link>
            <button
              type="button"
              onClick={() => void enablePushNotifications()}
              className="hidden sm:inline-flex min-h-10 items-center rounded-lg border border-border-dark px-4 py-2 text-sm font-medium text-text-primary-dark transition hover:bg-white/5 active:scale-95"
            >
              Activar push
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: theme.accent }}>
              {activeTenant.userEmail.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-dark bg-bg-dark px-4 py-2 text-xs font-medium text-text-secondary-dark sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span>BUILD: {ADMIN_BUILD_MARKER}</span>
            <span>
              Modo: {dashboardScope.mode === 'consolidated' ? 'Consolidado' : 'Sucursal activa'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 normal-case tracking-normal">
            <span className="text-xs text-text-secondary-dark">
              {dashboardScope.mode === 'consolidated' ? 'Vista consolidada' : 'Sucursal activa'}
            </span>
            <select
              value={sucursalId}
              onChange={(event) => updateSucursal(event.target.value)}
              className="min-h-10 min-w-48 rounded-lg border border-border-dark bg-bg-dark px-3 py-2 text-sm text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-active touch-manipulation"
            >
              <option value="">Consolidado / contexto actual</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id ?? sucursal.code ?? sucursal.name} value={sucursal.id ?? ''}>
                  {sucursal.name ?? 'Sucursal'}{sucursal.city ? ` · ${sucursal.city}` : ''}{sucursal.code ? ` (${sucursal.code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <main className="flex-1 overflow-auto bg-transparent p-4 sm:p-6">{children}</main>
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
