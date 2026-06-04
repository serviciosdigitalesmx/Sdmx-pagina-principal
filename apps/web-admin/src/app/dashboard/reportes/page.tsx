"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";

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
  const { role } = useAuth();
  const scope = getActiveScope();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = (await fixService.getReportsSummary()) as ReportsSummary;
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar reportes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [scope?.mode, scope?.sucursalId]);

  const statusRows = useMemo(() => {
    const counts = summary?.statusCounts ?? {};
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status,
        count: String(count),
      }));
  }, [summary?.statusCounts]);

  const technicianRows = useMemo(() => {
    const byTech = summary?.ordersByTechnician ?? {};
    return Object.entries(byTech)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        technician: name,
        orders: String(count),
      }));
  }, [summary?.ordersByTechnician]);

  const stats = useMemo(
    () => [
      { label: "Órdenes", value: String(summary?.ordersCount ?? 0), helper: "Registros reales del tenant." },
      { label: "Clientes", value: String(summary?.customersCount ?? 0), helper: "Clientes activos y visibles." },
      { label: "Inventario", value: String(summary?.inventoryCount ?? 0), helper: "Productos en catálogo." },
      { label: "Balance", value: currency(summary?.totalBalance ?? 0), helper: "Ingresos menos egresos." },
    ],
    [summary?.customersCount, summary?.inventoryCount, summary?.ordersCount, summary?.totalBalance],
  );

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Reportes"
        subtitle="Resumen operativo, productividad y estado real del tenant."
        icon="fas fa-chart-line"
        actionLabel="Actualizar"
        onAction={() => {
          setLoading(true);
          void fixService.getReportsSummary().then((data) => setSummary(data as ReportsSummary)).finally(() => setLoading(false));
        }}
        secondaryActionLabel={role === "owner" ? "Vista global" : "Vista del módulo"}
        stats={stats}
        loading={loading}
        columns={[
          { label: "Estado", key: "status" },
          { label: "Cantidad", key: "count" },
        ]}
        rows={statusRows}
        emptyTitle={loading ? "Cargando reportes…" : error ? "No pudimos cargar reportes" : "Sin datos suficientes"}
        emptyCopy={error || "El resumen se arma con datos reales de service_orders, customers e inventory."}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-base font-semibold text-zinc-50">Órdenes por técnico</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-zinc-300">
                  <tr>
                    <th className="px-4 py-3">Técnico</th>
                    <th className="px-4 py-3">Órdenes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {technicianRows.length > 0 ? (
                    technicianRows.map((row) => (
                      <tr key={row.technician}>
                        <td className="px-4 py-3 text-zinc-300">{row.technician}</td>
                        <td className="px-4 py-3 text-zinc-200">{row.orders}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-4 py-6 text-center text-sm text-zinc-500">
                        No hay asignaciones de técnicos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <h2 className="text-base font-semibold text-zinc-50">Indicadores clave</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">Productividad</dt>
                <dd className="mt-2 text-xl font-semibold text-zinc-50">{Math.round(Number(summary?.productivity ?? 0))}%</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">Valuación</dt>
                <dd className="mt-2 text-xl font-semibold text-zinc-50">{currency(summary?.inventoryValuation ?? 0)}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">Cuentas por cobrar</dt>
                <dd className="mt-2 text-xl font-semibold text-zinc-50">{currency(summary?.accountsReceivable ?? 0)}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">Última actualización</dt>
                <dd className="mt-2 text-xl font-semibold text-zinc-50">{summary?.lastUpdatedAt ? new Date(summary.lastUpdatedAt).toLocaleString("es-MX") : "No disponible"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
