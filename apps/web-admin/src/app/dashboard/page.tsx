"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Package, Users, ClipboardList, CheckCircle, Truck, DollarSign, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiOptions } from "@/lib/tenant";
import type { ReportsSummary } from "@/types";

const CHART_COLORS = {
  primary: "#1F7EDC",
  accent: "#FF6A2A",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
  muted: "#8A8F95",
};

const STATUS_COLORS: Record<string, string> = {
  recibido: "#1F7EDC",
  diagnostico: "#eab308",
  reparacion: "#FF6A2A",
  listo: "#22c55e",
  entregado: "#8A8F95",
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await apiClient.get<{ data: ReportsSummary }>("/reports/summary", getApiOptions());
      setSummary(data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner h-8 w-8" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="py-12 text-center">
        <p className="text-srf-muted">No se pudieron cargar los datos del dashboard</p>
        <button onClick={() => loadData()} className="btn-secondary mt-4">
          Reintentar
        </button>
      </div>
    );
  }

  const statusData = Object.entries(summary.statusCounts || {}).map(([name, value]) => ({
    name: name === "entregado" ? "Entregado" : name === "listo" ? "Listo" : name,
    value,
    color: STATUS_COLORS[name] || CHART_COLORS.muted,
  }));
  const overdueOrders = summary.overduePromisedOrders || [];
  const technicianData = Object.entries(summary.ordersByTechnician || {})
    .map(([name, count]) => ({ name: name.split(" ")[0] || name.slice(0, 10), count }))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Panel de Control</h1>
          <p className="mt-1 text-sm text-srf-muted">Resumen operativo del taller en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated ? <span className="text-xs text-srf-muted">Última actualización: {lastUpdated.toLocaleTimeString()}</span> : null}
          <button onClick={() => loadData(true)} disabled={refreshing} className="btn-outline py-2">
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Ingresos del mes" value={`$${summary.totalIncome.toFixed(2)}`} icon={<TrendingUp className="h-6 w-6" />} color="success" />
        <KPICard title="Egresos del mes" value={`$${summary.totalExpense.toFixed(2)}`} icon={<TrendingDown className="h-6 w-6" />} color="danger" />
        <KPICard title="Utilidad bruta" value={`$${summary.totalBalance.toFixed(2)}`} icon={<DollarSign className="h-6 w-6" />} color={summary.totalBalance > 0 ? "success" : "danger"} />
        <KPICard title="Productividad" value={`${summary.productivity}%`} icon={<CheckCircle className="h-6 w-6" />} color={summary.productivity >= 70 ? "success" : summary.productivity >= 50 ? "warning" : "danger"} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SimpleCard title="Órdenes activas" value={summary.ordersCount} icon={<ClipboardList className="h-5 w-5" />} onClick={() => router.push("/dashboard/ordenes")} />
        <SimpleCard title="Clientes" value={summary.customersCount} icon={<Users className="h-5 w-5" />} onClick={() => router.push("/dashboard/clientes")} />
        <SimpleCard title="Stock bajo" value={summary.lowStockCount} icon={<Package className="h-5 w-5" />} variant={summary.lowStockCount > 0 ? "warning" : "default"} onClick={() => router.push("/dashboard/stock")} />
        <SimpleCard title="Cuentas por cobrar" value={`$${summary.accountsReceivable.toFixed(2)}`} icon={<Truck className="h-5 w-5" />} onClick={() => router.push("/dashboard/finanzas")} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-srf-muted">Distribución por estado</h3>
          <div className="space-y-2">
            {statusData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg border border-srf-primary/20 bg-srf-surface/50 p-3">
                <span>{entry.name}</span>
                <span className="text-sm text-srf-muted">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-srf-muted">Órdenes por técnico</h3>
          <div className="space-y-2">
            {technicianData.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-lg border border-srf-primary/20 bg-srf-surface/50 p-3">
                <span>{entry.name}</span>
                <span className="text-sm text-srf-muted">{entry.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card border-l-4 border-l-red-500 p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-srf-muted">Órdenes atrasadas</h3>
          {overdueOrders.length > 0 ? (
            <div className="space-y-3">
              {overdueOrders.map((order) => (
                <button key={order.id} onClick={() => router.push(`/dashboard/tecnico?order=${order.id}`)} className="w-full rounded-lg border border-srf-primary/20 bg-srf-surface/50 p-3 text-left transition hover:bg-srf-surface">
                  <p className="text-sm font-semibold">{order.folio || order.id.slice(0, 8)}</p>
                  <p className="text-xs text-srf-muted">Prometido: {order.promisedDate}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-srf-muted">No hay órdenes atrasadas.</p>
          )}
        </div>
        <div className="card p-4">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-srf-muted">Atajos</h3>
          <div className="grid grid-cols-2 gap-3">
            <Shortcut label="Nueva Orden" onClick={() => router.push("/dashboard/ordenes")} />
            <Shortcut label="Clientes" onClick={() => router.push("/dashboard/clientes")} />
            <Shortcut label="Stock" onClick={() => router.push("/dashboard/stock")} />
            <Shortcut label="Compras" onClick={() => router.push("/dashboard/compras")} />
            <Shortcut label="Reportes" onClick={() => router.push("/dashboard/reportes")} />
            <Shortcut label="Seguridad" onClick={() => router.push("/dashboard/seguridad")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: "success" | "warning" | "danger" }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wider text-srf-muted">{title}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className={`text-2xl font-bold ${color === "success" ? "text-green-400" : color === "warning" ? "text-yellow-400" : "text-red-400"}`}>{value}</div>
        {icon}
      </div>
    </div>
  );
}

function SimpleCard({ title, value, icon, onClick, variant = "default" }: { title: string; value: number | string; icon: React.ReactNode; onClick: () => void; variant?: "default" | "warning" }) {
  return (
    <button onClick={onClick} className={`card p-4 text-left transition hover:-translate-y-0.5 ${variant === "warning" ? "border-yellow-500/40" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-srf-muted">{title}</p>
          <p className="mt-1 text-2xl font-bold text-srf-text">{value}</p>
        </div>
        {icon}
      </div>
    </button>
  );
}

function Shortcut({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-srf-primary/20 bg-srf-surface/50 px-3 py-4 text-sm font-semibold text-srf-text transition hover:bg-srf-surface">
      {label}
    </button>
  );
}

