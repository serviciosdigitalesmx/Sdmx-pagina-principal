"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type ArchiveRow = {
  folio: string;
  client: string;
  cierre: string;
  estado: string;
};

function normalizeStatus(value: string) {
  if (!value) return "cerrada";
  const lower = value.toLowerCase();
  if (lower.includes("cancel")) return "cancelada";
  if (lower.includes("entreg")) return "entregada";
  if (lower.includes("list")) return "lista";
  return value;
}

function resolveCloseDate(order: Record<string, unknown>) {
  const date = String(order.updated_at ?? order.created_at ?? "");
  return date ? new Date(date).toLocaleDateString("es-MX") : "No disponible";
}

export default function ArchivoPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getOrders();
      const archived = (data as Array<Record<string, unknown>>)
        .filter((order) => {
          const status = String(order.status ?? "").toLowerCase();
          return ["list", "entreg", "cerr", "complete", "ready", "delivered", "waiting"].some((value) => status.includes(value));
        })
        .map((order) => ({
          folio: String(order.folio ?? ""),
          client: String((order.device_info as { customer_name?: string } | undefined)?.customer_name ?? (order.customer_name ?? "")),
          cierre: resolveCloseDate(order),
          estado: normalizeStatus(String(order.status ?? "")),
        }));
      setRows(archived);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar archivo");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Órdenes cerradas", value: String(rows.length), helper: "Derivado de órdenes reales." },
      { label: "Rol", value: role, helper: "Permiso actual." },
      { label: "Exportaciones", value: "0", helper: "Pendiente de endpoint de exportación." },
    ],
    [role, rows.length],
  );

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Archivo"
        subtitle="Archivo operativo de órdenes cerradas y entregadas."
        icon="fas fa-archive"
        actionLabel={role === "technician" ? "Solo lectura" : "Buscar archivo"}
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void refresh()}
        stats={stats}
        loading={loading}
        columns={[
          { label: "Folio", key: "folio" },
          { label: "Cliente", key: "client" },
          { label: "Fecha cierre", key: "cierre" },
          { label: "Estado", key: "estado" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando archivo…" : error ? "No pudimos cargar el archivo" : "No hay órdenes cerradas todavía"}
        emptyCopy={error || "El archivo deriva de órdenes reales del tenant y no de datos simulados."}
      />
    </RequireRole>
  );
}
