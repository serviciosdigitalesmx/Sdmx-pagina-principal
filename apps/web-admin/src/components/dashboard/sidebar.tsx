'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Globe,
  ClipboardList,
  Wrench,
  FileText,
  Archive,
  Users,
  CheckSquare,
  Package,
  Truck,
  ShoppingCart,
  Wallet,
  LineChart,
  BarChart3,
  Building2,
  Shield,
  CircleDollarSign,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DASHBOARD_MODULES } from '@/types';
import { getActiveSucursalId, canUseConsolidatedView } from '@/lib/tenant';
import { isModuleEnabled, type TenantModuleKey } from '@/lib/module-access';
import { useTenantIdentity } from '@/providers/TenantIdentityProvider';
import { platformBrand } from '@/config/branding';

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Globe,
    ClipboardList,
    Wrench,
    FileText,
    Archive,
    Users,
    CheckSquare,
    Package,
    Truck,
    ShoppingCart,
    Wallet,
    LineChart,
    BarChart3,
    Building2,
    Shield,
    CircleDollarSign,
  };
  return icons[iconName] || LayoutDashboard;
};

const DASHBOARD_MODULE_ACCESS: Partial<Record<string, TenantModuleKey>> = {
  operativo: 'orders',
  tecnico: 'orders',
  solicitudes: 'requests',
  archivo: 'archive',
  clientes: 'customers',
  tareas: 'tasks',
  stock: 'inventory',
  proveedores: 'procurement',
  compras: 'procurement',
  gastos: 'finance',
  finanzas: 'finance',
  reportes: 'reports',
  movivendor: 'movivendor',
  sucursales: 'branches',
  seguridad: 'security',
};

const ROLE_ALLOWED_MODULES: Record<'owner' | 'manager' | 'technician' | 'client', string[] | null> = {
  owner: null,
  manager: null,
  technician: ['dashboard', 'tecnico', 'operativo', 'solicitudes', 'clientes', 'tareas', 'archivo'],
  client: ['dashboard', 'landing'],
};

export function Sidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { identity, isLoading } = useTenantIdentity();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSucursalId = mounted ? getActiveSucursalId() : null;
  const showConsolidated = mounted ? canUseConsolidatedView() : false;
  const visibleModules = DASHBOARD_MODULES.filter((module) => {
    const role = identity?.role ?? 'manager';
    const allowedByRole = ROLE_ALLOWED_MODULES[role as keyof typeof ROLE_ALLOWED_MODULES];
    if (allowedByRole && !allowedByRole.includes(module.key)) {
      return false;
    }

    if (module.key === 'dashboard' || module.key === 'landing') {
      return true;
    }

    if (module.key === 'movivendor') {
      return true;
    }

    const accessKey = DASHBOARD_MODULE_ACCESS[module.key];

    return accessKey ? isModuleEnabled(accessKey) : true;
  });

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(96,165,250,0.95),rgba(34,211,238,0.85))]">
            <span className="text-xs font-black text-white">{platformBrand.substring(0, 2).toUpperCase()}</span>
          </div>
          {!collapsed && (
            <span className="font-semibold tracking-[0.08em] text-slate-100">
              {platformBrand.substring(0, 2)}<span className="text-sky-400">{platformBrand.substring(2)}</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-xl p-1 text-slate-400 hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-sky-500/15"
            title="Volver al hub"
          >
            <LayoutDashboard className="h-5 w-5 text-sky-400" />
            <span>Volver al hub</span>
          </Link>
        </div>
      )}

      {/* Sucursal indicator */}
      {!collapsed && !isLoading && identity && (
        <div className="mx-4 mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">
          <p className="text-xs text-slate-400">Sucursal activa</p>
          <p className="text-sm font-semibold text-sky-400 truncate">
            {identity.branchName}
          </p>
          {showConsolidated && activeSucursalId !== 'GLOBAL' && (
            <p className="mt-1 text-xs text-slate-400">Vista consolidada disponible</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleModules.map((module) => {
          const Icon = getIcon(module.icon);
          const isActive = pathname === module.href || pathname.startsWith(`${module.href}/`);

          return (
            <Link
              key={module.key}
              href={module.href}
              className={`
                flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-200
                ${isActive
                  ? 'border-sky-500/30 bg-sky-500/10 text-slate-100 shadow-[0_12px_30px_rgba(59,130,246,0.12)]'
                  : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-100'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? module.label : undefined}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span className="text-sm font-medium">{module.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => onMobileOpenChange?.(true)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-slate-800 bg-slate-950/95 p-2 shadow-[0_12px_36px_rgba(2,6,23,0.4)] lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile sidebar */}
      <div
        className={`
          fixed inset-0 z-50 lg:hidden transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => onMobileOpenChange?.(false)} />
        <div className="relative h-full w-72 border-r border-slate-800 bg-slate-950/98">
          <button
            onClick={() => onMobileOpenChange?.(false)}
            className="absolute right-4 top-4 rounded-xl p-1 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:block border-r border-slate-800 transition-all duration-300 bg-slate-950
          ${collapsed ? 'w-[4.5rem]' : 'w-72'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
