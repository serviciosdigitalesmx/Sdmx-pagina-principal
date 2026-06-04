"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";

type FinanceRow = {
  id?: string;
  created_at?: string;
  type?: string;
  balance?: number | string;
  income?: number | string;
  expense?: number | string;
  sucursal_id?: string | null;
};

function currency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

export default function FinanzasPage() {
  const { role } = useAuth();
  const scope = getActiveScope();
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [cashflow, setCashflow] = useState<FinanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const balance = await fixService.getBalance();
      setRows(balance as FinanceRow[]);
      if (scope?.sucursalId) {
        const flow = await fixService.getCashflow(scope.sucursalId);
        setCashflow(flow as FinanceRow[]);
      } else {
        setCashflow([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar finanzas");
      setRows([]);
      setCashflow([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [scope?.sucursalId]);

  const summary = useMemo(() => {
    const income = rows.reduce((sum, row) => sum + Number(row.income ?? 0), 0);
    const expense = rows.reduce((sum, row) => sum + Number(row.expense ?? 0), 0);
    const balance = rows.length > 0 ? Number(rows[0]?.balance ?? income - expense) : income - expense;
    return { income, expense, balance };
  }, [rows]);

  const stats = useMemo(
    () => [
      { label: "Ingresos", value: currency(summary.income), helper: "Órdenes reales del tenant." },
      { label: "Egresos", value: currency(summary.expense), helper: "Gastos reales del tenant." },
      { label: "Balance", value: currency(summary.balance), helper: "Balance operativo real." },
      { label: "Rol", value: role, helper: "Permiso actual." },
    ],
    [role, summary.balance, summary.expense, summary.income],
  );

  return (
    <RequireRole allowed={["owner"]}>
      <ModuleShell
        title="Finanzas"
        subtitle="Vista financiera real del tenant con balance y flujo por sucursal."
        icon="fas fa-coins"
        actionLabel="Actualizar"
        onAction={() => void refresh()}
        stats={stats}
        loading={loading}
        columns={[
          { label: "Fecha", key: "created_at" },
          { label: "Tipo", key: "type" },
          { label: "Balance", key: "balance" },
          { label: "Ingreso", key: "income" },
          { label: "Egreso", key: "expense" },
        ]}
        rows={rows.slice(0, 20).map((row) => ({
          created_at: row.created_at ? new Date(row.created_at).toLocaleString("es-MX") : "No disponible",
          type: row.type ?? "summary",
          balance: currency(row.balance ?? 0),
          income: currency(row.income ?? 0),
          expense: currency(row.expense ?? 0),
        }))}
        emptyTitle={loading ? "Cargando finanzas…" : error ? "No pudimos cargar finanzas" : "Sin movimientos"}
        emptyCopy={error || "Los datos salen de service_orders y finances reales."}
      >
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <h2 className="text-base font-semibold text-zinc-50">Flujo por sucursal</h2>
          <p className="mt-1 text-sm text-zinc-400">{scope?.sucursalId ? `Sucursal ${scope.sucursalId}` : "No hay sucursal activa para flujo detallado."}</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-zinc-300">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Ingreso</th>
                  <th className="px-4 py-3">Egreso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {cashflow.length > 0 ? cashflow.map((row) => (
                  <tr key={row.id ?? `${row.created_at ?? ""}-${row.type ?? ""}`}>
                    <td className="px-4 py-3 text-zinc-300">{row.created_at ? new Date(row.created_at).toLocaleDateString("es-MX") : "No disponible"}</td>
                    <td className="px-4 py-3 text-zinc-300">{currency(row.balance ?? 0)}</td>
                    <td className="px-4 py-3 text-zinc-300">{currency(row.income ?? 0)}</td>
                    <td className="px-4 py-3 text-zinc-300">{currency(row.expense ?? 0)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-500">
                      {scope?.sucursalId ? "Sin flujo disponible para esta sucursal." : "Selecciona una sucursal para ver flujo detallado."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
