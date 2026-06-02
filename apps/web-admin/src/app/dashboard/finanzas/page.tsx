"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";

type FinanceRow = Record<string, string>;

export default function Page() {
  const { role } = useAuth();
  const scope = getActiveScope();
  const activeSucursalId = scope?.sucursalId ?? "";
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        if (role !== "owner" && !activeSucursalId) {
          throw new Error("Sucursal activa requerida");
        }
        const data = role === "owner" ? await fixService.getBalance() : await fixService.getCashflow(activeSucursalId);
        if (!cancelled) {
          setRows(
            (data as Record<string, unknown>[]).map((row) =>
              Object.fromEntries(
                Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)])
              ) as FinanceRow
            )
          );
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar finanzas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeSucursalId, role]);

  const stats = useMemo(
    () => [
      { label: "Registros", value: String(rows.length), helper: "Datos del taller." },
      { label: "Rol", value: role, helper: "Permisos reales por usuario." },
      { label: "Sucursal", value: role === "owner" && scope?.mode === "consolidated" ? "Consolidado" : activeSucursalId || "No disponible", helper: scope?.mode === "consolidated" ? "Vista consolidada." : "Sucursal activa." },
    ],
    [activeSucursalId, role, rows.length, scope?.mode]
  );

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Finanzas"
        subtitle="Balances y flujo financiero del taller."
        icon="fas fa-chart-line"
        actionLabel={role === "owner" ? "Balance global" : "Ver flujo por sucursal"}
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => {
          void (async () => {
            try {
              setLoading(true);
              setError("");
              if (role !== "owner" && !activeSucursalId) {
                throw new Error("Sucursal activa requerida");
              }
              const data = role === "owner" ? await fixService.getBalance() : await fixService.getCashflow(activeSucursalId);
              setRows(
                (data as Record<string, unknown>[]).map((row) =>
                  Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [key, value == null ? "" : String(value)])
                  ) as FinanceRow
                )
              );
            } catch (err) {
              setError(err instanceof Error ? err.message : "Error al cargar finanzas");
            } finally {
              setLoading(false);
            }
          })();
        }}
        stats={stats}
        loading={loading}
        columns={[
          { label: "ID", key: "id" },
          { label: "Balance", key: "balance" },
          { label: "Ingreso", key: "income" },
          { label: "Egreso", key: "expense" },
        ]}
        rows={rows}
        emptyTitle={loading ? "Cargando finanzas…" : error ? "No pudimos cargar las finanzas" : "Sin movimientos financieros todavía"}
        emptyCopy={error || "Aquí verás balances, ingresos y egresos cuando el taller registre movimientos reales."}
      />
    </RequireRole>
  );
}
