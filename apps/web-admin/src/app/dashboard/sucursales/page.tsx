"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type BranchRow = {
  id?: string;
  name?: string;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export default function SucursalesPage() {
  const { role, sucursalId } = useAuth();
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fixService.getBranches();
        if (!cancelled) setRows(data as BranchRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar sucursales");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeRows = useMemo(() => rows.filter((row) => row.is_active !== false), [rows]);
  const selectedBranch = rows.find((row) => row.id === sucursalId) ?? null;

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Sucursales"
        subtitle="Control de sucursales con aislamiento por sucursal."
        icon="fas fa-store"
        actionLabel={role === "owner" ? "Agregar sucursal" : "Ver sucursal actual"}
        stats={[
          { label: "Sucursales", value: String(rows.length), helper: "Cargadas desde la API." },
          { label: "Activas", value: String(activeRows.length), helper: "Filtrado por estado." },
          { label: "Contexto", value: selectedBranch?.name ?? sucursalId ?? "N/D", helper: "Sucursal actual." },
        ]}
        columns={[
          { label: "Nombre", key: "nombre" },
          { label: "Código", key: "code" },
          { label: "Ciudad", key: "city" },
          { label: "Estado", key: "state" },
        ]}
        rows={rows.map((row) => ({
          nombre: row.name ?? "-",
          code: row.code ?? "-",
          city: row.city ?? "-",
          state: row.state ?? "-",
        }))}
        emptyTitle={loading ? "Cargando sucursales…" : error ? "No pudimos cargar sucursales" : "Sin sucursales todavía"}
        emptyCopy={error || "Aquí verás las sucursales del taller cuando estén registradas."}
      />
    </RequireRole>
  );
}
