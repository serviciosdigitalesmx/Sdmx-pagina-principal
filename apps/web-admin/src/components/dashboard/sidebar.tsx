"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { DASHBOARD_MODULES } from "@/types";
import { getActiveSucursalId, canUseConsolidatedView } from "@/lib/tenant";

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
  const activeSucursalId = getActiveSucursalId();
  const showConsolidated = canUseConsolidatedView();

  return (
    <aside className="hidden lg:block w-64 border-r border-srf-primary/30 bg-srf-bg text-srf-text">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-srf-primary/30 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-srf-primary text-xs font-bold text-white">SF</div>
          <span className="font-bold text-srf-primary">SR<span className="text-srf-accent">FIX</span></span>
        </div>

        {activeSucursalId ? (
          <div className="mx-4 mt-4 rounded-lg border border-srf-primary/30 bg-srf-primary/10 p-3 text-center">
            <p className="text-xs text-srf-muted">Sucursal activa</p>
            <p className="truncate text-sm font-semibold text-srf-primary">{activeSucursalId === "GLOBAL" ? "Todas las sucursales" : activeSucursalId.slice(0, 8)}</p>
            {showConsolidated && activeSucursalId !== "GLOBAL" ? <p className="mt-1 text-xs text-srf-muted">Vista consolidada disponible</p> : null}
          </div>
        ) : null}

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {DASHBOARD_MODULES.map((module) => {
            const Icon = getIcon(module.icon);
            const isActive = pathname === module.href || pathname.startsWith(`${module.href}/`);
            return (
              <Link
                key={module.key}
                href={module.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${isActive ? "border border-srf-accent/40 bg-srf-accent/20 text-srf-accent" : "text-srf-muted hover:bg-srf-surface/50 hover:text-srf-text"}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{module.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

