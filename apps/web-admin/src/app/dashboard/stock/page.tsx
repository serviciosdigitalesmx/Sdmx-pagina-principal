"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type InventoryRow = {
  id?: string;
  sku?: string;
  description?: string;
  stock?: number | string;
  branch_id?: string | null;
  created_at?: string;
};

type MovementRow = {
  id?: string;
  movement_type?: string;
  quantity?: number | string;
  reference?: string | null;
  notes?: string | null;
  created_at?: string;
};

const emptyForm = {
  sku: "",
  description: "",
  stock: "0",
  branchId: "",
};

export default function StockPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedMovements, setSelectedMovements] = useState<MovementRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getInventory();
      const typed = data as InventoryRow[];
      setRows(typed);
      setSelectedId((current) => current || typed[0]?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInventory();
  }, []);

  const selected = useMemo(() => rows.find((item) => item.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      sku: selected.sku ?? "",
      description: selected.description ?? "",
      stock: String(selected.stock ?? 0),
      branchId: selected.branch_id ?? "",
    });
  }, [selected]);

  useEffect(() => {
    const selectedInventoryId = selected?.id ?? "";
    if (!selectedInventoryId) {
      setSelectedMovements([]);
      return;
    }
    let cancelled = false;
    async function loadMovements() {
      try {
        const data = await fixService.getInventoryMovements(selectedInventoryId);
        if (!cancelled) setSelectedMovements(data as MovementRow[]);
      } catch {
        if (!cancelled) setSelectedMovements([]);
      }
    }
    void loadMovements();
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  const stats = useMemo(
    () => [
      { label: "Productos", value: String(rows.length), helper: "Inventario del taller." },
      { label: "Sucursal", value: selected?.branch_id || "Global", helper: "Filtro por sucursal." },
      { label: "Rol", value: role, helper: "Permisos por usuario." },
    ],
    [rows.length, role, selected?.branch_id],
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        sku: form.sku.trim(),
        description: form.description.trim(),
        stock: Number(form.stock || 0),
        branchId: form.branchId.trim() || undefined,
      };

      if (selected?.id) {
        await fixService.updateInventoryItem(selected.id, {
          description: payload.description,
          stock: payload.stock,
          branchId: payload.branchId ?? null,
        });
      } else {
        await fixService.createInventoryItem(payload);
      }
      setSelectedId("");
      setForm(emptyForm);
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el inventario");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjustStock() {
    if (!selected?.id) return;
    try {
      setSaving(true);
      setError("");
      await fixService.updateInventoryItem(selected.id, {
        stock: Number(form.stock || 0),
        description: form.description.trim(),
        branchId: form.branchId.trim() || null,
      });
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ajustar el stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager", "technician"]}>
      <ModuleShell
        title="Inventarios"
        subtitle="Productos, existencias y movimientos conectados al runtime real."
        icon="fas fa-boxes-stacked"
        actionLabel="Nuevo producto"
        onAction={() => {
          setSelectedId("");
          setForm(emptyForm);
        }}
        stats={stats}
        columns={[
          { label: "SKU", key: "sku" },
          { label: "Descripción", key: "description" },
          { label: "Stock", key: "stock" },
          { label: "Sucursal", key: "branch_id" },
        ]}
        rows={rows.map((row) => ({
          sku: row.sku ?? "",
          description: row.description ?? "",
          stock: String(row.stock ?? 0),
          branch_id: row.branch_id ?? "Global",
        }))}
        emptyTitle={loading ? "Cargando inventario…" : error ? "No pudimos cargar inventario" : "No hay productos todavía"}
        emptyCopy={error || "La lista sale del inventario del taller."}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-50">{selected?.id ? "Editar producto" : "Crear producto"}</h2>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Producto activo</span>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
              >
                <option value="">Nuevo producto</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.sku} · {row.description}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["sku", "SKU"],
                ["description", "Descripción"],
                ["stock", "Stock"],
                ["branchId", "Sucursal (branchId)"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-1 text-sm text-zinc-300">
                  <span>{label}</span>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleAdjustStock()}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
              >
                Ajustar stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedId("");
                  setForm(emptyForm);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
              >
                Limpiar
              </button>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </form>

          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-zinc-50">Movimientos del producto</h2>
            <div className="space-y-2">
              {selectedMovements.length > 0 ? selectedMovements.map((movement) => (
                <div key={movement.id ?? `${movement.created_at}-${movement.quantity}`} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-200">{movement.movement_type}</span>
                    <span className="text-zinc-400">{String(movement.quantity ?? 0)}</span>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">{movement.notes || movement.reference || "Movimiento real"}</div>
                </div>
              )) : (
                <p className="text-sm text-zinc-400">Selecciona un producto para ver sus movimientos reales.</p>
              )}
            </div>
          </div>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
