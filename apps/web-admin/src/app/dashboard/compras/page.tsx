"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type ProcurementSummary = {
  totalItems: number;
  lowStockThreshold: number;
  lowStockCount: number;
  totalStock: number;
  lowStockItems: Array<Record<string, unknown>>;
};

export default function Page() {
  const { role } = useAuth();
  const [summary, setSummary] = useState<ProcurementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = (await fixService.getProcurementSummary()) as ProcurementSummary;
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar compras");
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
      { label: "Artículos", value: String(summary?.totalItems ?? 0), helper: "Inventario real del tenant." },
      { label: "Bajo stock", value: String(summary?.lowStockCount ?? 0), helper: `Umbral ${summary?.lowStockThreshold ?? 5}` },
      { label: "Stock total", value: String(summary?.totalStock ?? 0), helper: "Suma real de existencias." },
    ],
    [summary]
  );

  const rows = (summary?.lowStockItems ?? []).map((item) => ({
    sku: String(item.sku ?? ""),
    description: String(item.description ?? ""),
    stock: String(item.stock ?? ""),
    branch_id: String(item.branch_id ?? ""),
  }));

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Compras"
        subtitle="Reabasto y alertas de stock derivadas de inventario real."
        icon="fas fa-cart-shopping"
        actionLabel={role === "owner" ? "Ver reabasto" : "Solo lectura"}
        stats={stats}
        columns={[
          { label: "SKU", key: "sku" },
          { label: "Descripción", key: "description" },
          { label: "Stock", key: "stock" },
          { label: "Sucursal", key: "branch_id" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando compras…" : error ? "No pudimos cargar compras" : "Sin alertas de reabasto"}
        emptyCopy={error || "Cuando no hay stock bajo, la pantalla muestra vacío real. Los datos vienen de /api/:tenantId/procurement/summary."}
      />
    </RequireRole>
  );
}
