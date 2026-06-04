'use client';

import { useState } from 'react';
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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeSucursalId = getActiveSucursalId();
  const showConsolidated = canUseConsolidatedView();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-srf-primary/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-srf-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">SF</span>
          </div>
          {!collapsed && (
            <span className="font-orbitron font-bold text-srf-primary">
              SR<span className="text-srf-accent">FIX</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-srf-surface/50 text-srf-muted"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="p-1 rounded-lg hover:bg-srf-surface/50 text-srf-muted"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sucursal indicator */}
      {!collapsed && activeSucursalId && (
        <div className="mx-4 mt-4 p-2 rounded-lg bg-srf-primary/10 border border-srf-primary/30 text-center">
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
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {DASHBOARD_MODULES.map((module) => {
          const Icon = getIcon(module.icon);
          const isActive = pathname === module.href || pathname.startsWith(`${module.href}/`);

          return (
            <Link
              key={module.key}
              href={module.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-srf-accent/20 text-srf-accent border border-srf-accent/40'
                  : 'text-srf-muted hover:bg-srf-surface/50 hover:text-srf-text'
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
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-srf-surface border border-srf-primary/30 lg:hidden"
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
        <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
        <div className="relative w-64 h-full bg-srf-bg border-r border-srf-primary/30">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-srf-surface/50"
          >
            <X className="w-5 h-5" />
          </button>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`
          hidden lg:block border-r border-srf-primary/30 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}