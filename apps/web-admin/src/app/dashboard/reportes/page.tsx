"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, LineChart, RefreshCw, Users, Package, Wallet } from "lucide-react";
import { getActiveScope } from "@/lib/scope";
import { reportsService } from "@/services/reports/reportsService";

type ReportsSummary = {
  ordersCount: number;
  customersCount: number;
  inventoryCount: number;
  lowStockCount: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  productivity?: number;
  inventoryValuation?: number;
  accountsReceivable?: number;
  ordersByTechnician?: Record<string, number>;
  statusCounts: Record<string, number>;
  lastUpdatedAt: string | null;
};

function currency(value: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

export default function ReportesPage() {
  const scope = getActiveScope();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = (await reportsService.getReportsSummary()) as ReportsSummary;
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar reportes");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setMounted(true);
    void load();
  }, [scope?.mode, scope?.sucursalId]);

  const statusRows = useMemo(() => {
    const counts = summary?.statusCounts ?? {};
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [summary?.statusCounts]);

  const technicianRows = useMemo(() => {
    const byTech = summary?.ordersByTechnician ?? {};
    return Object.entries(byTech).sort((a, b) => b[1] - a[1]);
  }, [summary?.ordersByTechnician]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Reportes</h1>
          <p className="mt-1 text-sm text-srf-muted">Resumen operativo real del tenant y de la sucursal activa.</p>
        </div>
        <button onClick={() => void load()} className="btn-outline inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card text-center">
          <BarChart3 className="mx-auto w-5 h-5 text-srf-primary" />
          <div className="mt-3 text-3xl font-bold text-srf-primary">{summary?.ordersCount ?? 0}</div>
          <div className="text-xs text-srf-muted">Órdenes</div>
        </div>
        <div className="card text-center">
          <Users className="mx-auto w-5 h-5 text-srf-primary" />
          <div className="mt-3 text-3xl font-bold text-srf-primary">{summary?.customersCount ?? 0}</div>
          <div className="text-xs text-srf-muted">Clientes</div>
        </div>
        <div className="card text-center">
          <Package className="mx-auto w-5 h-5 text-srf-accent" />
          <div className="mt-3 text-3xl font-bold text-srf-accent">{summary?.inventoryCount ?? 0}</div>
          <div className="text-xs text-srf-muted">Items de inventario</div>
        </div>
        <div className="card text-center">
          <Wallet className="mx-auto w-5 h-5 text-srf-accent" />
          <div className="mt-3 text-3xl font-bold text-srf-accent">{currency(summary?.totalBalance ?? 0)}</div>
          <div className="text-xs text-srf-muted">Balance visible</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center gap-2 text-srf-primary">
            <LineChart className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Estados de órdenes</h2>
          </div>
          <div className="space-y-3">
            {statusRows.length > 0 ? statusRows.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-xl border border-srf-primary/20 bg-black/20 px-4 py-3">
                <span className="text-sm text-srf-text">{status}</span>
                <span className="badge-recibido">{count}</span>
              </div>
            )) : <div className="text-sm text-srf-muted">Sin datos de estados todavía.</div>}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center gap-2 text-srf-primary">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Órdenes por técnico</h2>
          </div>
          <div className="space-y-3">
            {technicianRows.length > 0 ? technicianRows.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-srf-primary/20 bg-black/20 px-4 py-3">
                <span className="text-sm text-srf-text">{name}</span>
                <span className="badge-diagnostico">{count}</span>
              </div>
            )) : <div className="text-sm text-srf-muted">No hay técnicos asignados todavía.</div>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Productividad</div>
          <div className="mt-3 text-2xl font-bold text-srf-primary">{Math.round(Number(summary?.productivity ?? 0))}%</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Valuación</div>
          <div className="mt-3 text-2xl font-bold text-srf-primary">{currency(summary?.inventoryValuation ?? 0)}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Cuentas por cobrar</div>
          <div className="mt-3 text-2xl font-bold text-srf-primary">{currency(summary?.accountsReceivable ?? 0)}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Última actualización</div>
          <div className="mt-3 text-sm font-semibold text-srf-text">
            {mounted && summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString("es-MX") : "No disponible"}
          </div>
        </div>
      </div>
    </div>
  );
}
