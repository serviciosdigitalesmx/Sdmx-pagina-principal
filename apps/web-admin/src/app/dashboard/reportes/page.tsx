"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type ReportsSummary = {
  ordersCount: number;
  customersCount: number;
  inventoryCount: number;
  lowStockCount: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  statusCounts: Record<string, number>;
  lastUpdatedAt: string | null;
};

export default function Page() {
  const { role } = useAuth();
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
  }, []);

  const stats = useMemo(
    () => [
      { label: "Órdenes", value: String(summary?.ordersCount ?? 0), helper: "Service orders reales." },
      { label: "Clientes", value: String(summary?.customersCount ?? 0), helper: "Catálogo real." },
      { label: "Inventario", value: String(summary?.inventoryCount ?? 0), helper: "Stock real." },
      { label: "Bajo stock", value: String(summary?.lowStockCount ?? 0), helper: "Alertas derivadas." },
      { label: "Ingreso", value: String(summary?.totalIncome ?? 0), helper: "Agregado real." },
      { label: "Egreso", value: String(summary?.totalExpense ?? 0), helper: "Agregado real." },
    ],
    [summary]
  );

  const rows = [
    { metric: "Balance total", value: String(summary?.totalBalance ?? 0) },
    { metric: "Última actualización", value: summary?.lastUpdatedAt ?? "Sin datos" },
    ...Object.entries(summary?.statusCounts ?? {}).map(([key, value]) => ({ metric: key, value: String(value) })),
  ];

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Reportes"
        subtitle="KPIs reales agregados desde órdenes, clientes, inventario y finanzas."
        icon="fas fa-chart-pie"
        actionLabel={role === "owner" ? "Ver agregado" : "Solo lectura"}
        stats={stats}
        columns={[
          { label: "Métrica", key: "metric" },
          { label: "Valor", key: "value" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando reportes…" : error ? "No pudimos cargar reportes" : "Sin datos agregados todavía"}
        emptyCopy={error || "Los reportes se construyen desde /api/:tenantId/reports/summary sin inventar KPIs."}
      />
    </RequireRole>
  );
}
