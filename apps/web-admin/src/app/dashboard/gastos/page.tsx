"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";

type ExpenseRow = {
  id?: string;
  sucursal_id?: string | null;
  description?: string | null;
  category?: string | null;
  expense?: number | string | null;
  created_at?: string | null;
  type?: string | null;
};

const INITIAL_FORM = {
  sucursalId: "",
  amount: "",
  description: "",
  category: "operativo",
  date: "",
};

function currency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

export default function GastosPage() {
  const { role } = useAuth();
  const scope = getActiveScope();
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(INITIAL_FORM);

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getExpenses();
      setRows((data as ExpenseRow[]).sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar gastos");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!scope?.sucursalId) return;
    setForm((current) => (current.sucursalId ? current : { ...current, sucursalId: scope.sucursalId ?? "" }));
  }, [scope?.sucursalId]);

  const stats = useMemo(
    () => [
      { label: "Gastos", value: String(rows.length), helper: "Movimientos reales del tenant." },
      { label: "Total", value: currency(rows.reduce((sum, row) => sum + Number(row.expense ?? 0), 0)), helper: "Suma de egresos." },
      { label: "Sucursal", value: scope?.sucursalId ?? "No disponible", helper: scope?.mode === "consolidated" ? "Vista consolidada." : "Sucursal activa." },
    ],
    [rows, scope?.mode, scope?.sucursalId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await fixService.createExpense({
        sucursalId: form.sucursalId.trim(),
        amount: Number(form.amount || 0),
        description: form.description.trim(),
        category: form.category.trim(),
        date: form.date.trim() || undefined,
      });
      setForm({ ...INITIAL_FORM, sucursalId: scope?.sucursalId ?? "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el gasto");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!window.confirm("¿Eliminar este gasto real?")) return;
    try {
      setSaving(true);
      setError("");
      await fixService.deleteExpense(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el gasto");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Gastos"
        subtitle="Control real de egresos y movimientos financieros del tenant."
        icon="fas fa-receipt"
        actionLabel="Actualizar"
        onAction={() => void refresh()}
        secondaryActionLabel="Nuevo gasto"
        secondaryOnAction={() => setForm({ ...INITIAL_FORM, sucursalId: scope?.sucursalId ?? "" })}
        stats={stats}
        loading={loading}
        columns={[
          { label: "Descripción", key: "description" },
          { label: "Categoría", key: "category" },
          { label: "Monto", key: "expense" },
          { label: "Fecha", key: "created_at" },
        ]}
        rows={rows.map((row) => ({
          description: row.description ?? "Sin descripción",
          category: row.category ?? "operativo",
          expense: currency(row.expense ?? 0),
          created_at: row.created_at ? new Date(row.created_at).toLocaleString("es-MX") : "No disponible",
        }))}
        emptyTitle={loading ? "Cargando gastos…" : error ? "No pudimos cargar gastos" : "Sin gastos registrados"}
        emptyCopy={error || "Los gastos salen de la tabla real `finances`."}
      >
        <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-50">Capturar gasto real</h2>
            <button type="submit" disabled={saving} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Sucursal</span>
              <input value={form.sucursalId} onChange={(event) => setForm((current) => ({ ...current, sucursalId: event.target.value }))} className="input" />
            </label>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Monto</span>
              <input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="input" />
            </label>
            <label className="space-y-1 text-sm text-zinc-300 md:col-span-2">
              <span>Descripción</span>
              <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="input" />
            </label>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Categoría</span>
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="input" />
            </label>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Fecha</span>
              <input type="date" value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="input" />
            </label>
          </div>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </form>

        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-zinc-300">
              <tr>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.length > 0 ? rows.map((row) => (
                <tr key={row.id ?? `${row.created_at ?? ""}-${row.description ?? ""}`}>
                  <td className="px-4 py-3 text-zinc-300">{row.description ?? "Sin descripción"}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.category ?? "operativo"}</td>
                  <td className="px-4 py-3 text-zinc-300">{currency(row.expense ?? 0)}</td>
                  <td className="px-4 py-3 text-zinc-300">{row.created_at ? new Date(row.created_at).toLocaleString("es-MX") : "No disponible"}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void handleDelete(row.id)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-200">
                      Eliminar
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-zinc-500">
                    Sin gastos reales cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
