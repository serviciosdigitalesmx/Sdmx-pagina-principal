'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
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
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { DASHBOARD_MODULES } from '@/types';
import { getActiveSucursalId, canUseConsolidatedView } from '@/lib/tenant';

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
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
  };
  return icons[iconName] || LayoutDashboard;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeSucursalId = mounted ? getActiveSucursalId() : null;
  const showConsolidated = mounted ? canUseConsolidatedView() : false;

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(31,126,220,0.95),rgba(255,106,42,0.85))]">
            <span className="text-xs font-black text-white">FX</span>
          </div>
          {!collapsed && (
            <span className="font-orbitron font-bold tracking-[0.16em] text-srf-primary">
              FI<span className="text-srf-accent">XI</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-xl p-1 text-srf-muted hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="rounded-xl p-1 text-srf-muted hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sucursal indicator */}
      {!collapsed && activeSucursalId && (
        <div className="mx-4 mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
          <p className="text-xs text-srf-muted">Sucursal activa</p>
          <p className="text-sm font-semibold text-srf-primary truncate">
            {activeSucursalId === 'GLOBAL' ? 'Todas las sucursales' : activeSucursalId.slice(0, 8)}
          </p>
          {showConsolidated && activeSucursalId !== 'GLOBAL' && (
            <p className="text-xs text-srf-muted mt-1">Vista consolidada disponible</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {DASHBOARD_MODULES.map((module) => {
          const Icon = getIcon(module.icon);
          const isActive = pathname === module.href || pathname.startsWith(`${module.href}/`);

          return (
            <Link
              key={module.key}
              href={module.href}
              className={`
                flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-200
                ${isActive
                  ? 'border-srf-accent/40 bg-srf-accent/15 text-srf-text shadow-[0_12px_30px_rgba(255,106,42,0.12)]'
                  : 'border-transparent text-srf-muted hover:border-white/10 hover:bg-white/5 hover:text-srf-text'
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
        className="fixed left-4 top-4 z-50 rounded-xl border border-white/10 bg-[rgba(20,20,20,0.92)] p-2 shadow-[0_12px_36px_rgba(0,0,0,0.28)] lg:hidden"
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
        <div className="relative h-full w-72 border-r border-white/10 bg-[rgba(18,18,18,0.98)]">
          <button
            onClick={() => onMobileOpenChange?.(false)}
            className="absolute right-4 top-4 rounded-xl p-1 hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:block border-r border-white/10 transition-all duration-300
          ${collapsed ? 'w-[4.5rem]' : 'w-72'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
