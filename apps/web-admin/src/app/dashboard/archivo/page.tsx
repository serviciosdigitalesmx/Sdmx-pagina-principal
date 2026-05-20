"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type ArchivedOrder = {
  folio: string;
  client: string;
  cierre: string;
  estado: string;
};

export default function ArchivoPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<ArchivedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fixService.getOrders();
        const archived = (data as Array<Record<string, unknown>>)
          .filter((order) => {
            const status = String(order.status ?? "").toLowerCase();
            return ["listo", "entregado", "cerrado", "completed", "complete"].some((value) => status.includes(value));
          })
          .map((order) => ({
            folio: String(order.folio ?? ""),
            client: String((order.device_info as { customer_name?: string } | undefined)?.customer_name ?? ""),
            cierre: String(order.created_at ?? ""),
            estado: String(order.status ?? ""),
          }));

        if (!cancelled) setRows(archived);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar archivo");
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
      { label: "Órdenes cerradas", value: String(rows.length), helper: "Derivado de órdenes reales." },
      { label: "Rango", value: "Auto", helper: "Se calcula desde created_at." },
      { label: "Exportaciones", value: "0", helper: "Pendiente de endpoint de exportación." },
    ],
    [rows.length]
  );

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Archivo"
        subtitle="Historial de órdenes cerradas y entregadas desde órdenes reales."
        icon="fas fa-archive"
        actionLabel={role === "technician" ? "Solo lectura" : "Buscar archivo"}
        stats={stats}
        columns={[
          { label: "Folio", key: "folio" },
          { label: "Cliente", key: "client" },
          { label: "Fecha cierre", key: "cierre" },
          { label: "Estado", key: "estado" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando archivo…" : error ? "No pudimos cargar el archivo" : "No hay órdenes cerradas todavía"}
        emptyCopy={error || "Cuando no hay órdenes cerradas, la pantalla muestra vacío real. El archivo deriva de /api/:tenantId/orders."}
      />
    </RequireRole>
  );
}
