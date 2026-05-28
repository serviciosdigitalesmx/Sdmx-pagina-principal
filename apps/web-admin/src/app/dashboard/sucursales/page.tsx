"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type SucursalRow = {
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

const emptyForm = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  phone: "",
  isActive: true,
};

export default function SucursalesPage() {
  const { role, sucursalId } = useAuth();
  const [rows, setRows] = useState<SucursalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState("");
  const [form, setForm] = useState(emptyForm);

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getSucursales();
      setRows(data as SucursalRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar sucursales");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const activeRows = useMemo(() => rows.filter((row) => row.is_active !== false), [rows]);
  const selectedSucursal = rows.find((row) => row.id === sucursalId) ?? null;
  const selectedEditing = editingId ? rows.find((row) => row.id === editingId) ?? null : null;

  useEffect(() => {
    if (!selectedEditing) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: selectedEditing.name ?? "",
      code: selectedEditing.code ?? "",
      address: selectedEditing.address ?? "",
      city: selectedEditing.city ?? "",
      state: selectedEditing.state ?? "",
      phone: selectedEditing.phone ?? "",
      isActive: selectedEditing.is_active !== false,
    });
  }, [selectedEditing]);

  async function submitSucursal() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        phone: form.phone.trim() || undefined,
        isActive: form.isActive,
      };

      if (editingId) {
        await fixService.updateSucursal(editingId, payload);
        setSuccess("Sucursal actualizada.");
      } else {
        await fixService.createSucursal(payload);
        setSuccess("Sucursal creada.");
      }

      setEditingId(null);
      setForm(emptyForm);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar sucursal");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSucursal(row: SucursalRow) {
    if (!row.id) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await fixService.updateSucursal(row.id, { isActive: row.is_active === false });
      setSuccess(row.is_active === false ? "Sucursal activada." : "Sucursal desactivada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSucursal(id?: string) {
    if (!id) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await fixService.deleteSucursal(id);
      setSuccess("Sucursal eliminada.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar sucursal");
    } finally {
      setSaving(false);
    }
  }

  async function assignUser() {
    if (!editingId || !assigningUserId.trim()) return;
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      await fixService.assignUserToSucursal(editingId, assigningUserId.trim());
      setSuccess("Usuario asignado a la sucursal.");
      setAssigningUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar usuario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Sucursales"
        subtitle="Alta, edición y control por sucursal con aislamiento por tenant."
        icon="fas fa-store"
        actionLabel={saving ? "Guardando..." : editingId ? "Actualizar sucursal" : "Agregar sucursal"}
        onAction={() => void submitSucursal()}
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void refresh()}
        stats={[
          { label: "Sucursales", value: String(rows.length), helper: "Cargadas desde la API." },
          { label: "Activas", value: String(activeRows.length), helper: "Filtrado por estado." },
          { label: "Contexto", value: selectedSucursal?.name ?? sucursalId ?? "N/D", helper: "Sucursal actual." },
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
      >
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["name", "Nombre"],
                ["code", "Código"],
                ["address", "Dirección"],
                ["city", "Ciudad"],
                ["state", "Estado"],
                ["phone", "Teléfono"],
              ].map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</span>
                  <input
                    value={form[key as keyof typeof form] as string}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20"
                  />
                </label>
              ))}
              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                <span className="text-sm text-zinc-200">Sucursal activa</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void submitSucursal()}
                className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950"
              >
                {editingId ? "Guardar cambios" : "Crear sucursal"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Asignar usuario</h3>
              <p className="mt-2 text-sm text-zinc-300">
                Selecciona una sucursal en edición y asigna un usuario por `userId`.
              </p>
            </div>
            <input
              value={assigningUserId}
              onChange={(event) => setAssigningUserId(event.target.value)}
              placeholder="UUID del usuario"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20"
            />
            <button
              type="button"
              onClick={() => void assignUser()}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100"
              disabled={!editingId}
            >
              Asignar a {editingId ? "sucursal actual" : "una sucursal"}
            </button>
            {selectedEditing ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                <div className="font-semibold text-zinc-50">Editando: {selectedEditing.name}</div>
                <div className="mt-1">Estado: {selectedEditing.is_active === false ? "Inactiva" : "Activa"}</div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-3xl border border-zinc-800">
          <div className="grid grid-cols-1 gap-4 bg-zinc-950/90 p-4 md:grid-cols-4">
            {rows.map((row) => (
              <div key={row.id ?? row.code ?? row.name} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="font-semibold text-zinc-50">{row.name ?? "Sucursal"}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">{row.code ?? "sin código"}</div>
                <div className="mt-3 text-sm text-zinc-300">{row.city ?? "Sin ciudad"}{row.state ? ` · ${row.state}` : ""}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(row.id ?? null);
                    }}
                    className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleSucursal(row)}
                    className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-100"
                  >
                    {row.is_active === false ? "Activar" : "Desactivar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteSucursal(row.id)}
                    className="rounded-full border border-red-800 px-3 py-1.5 text-xs font-semibold text-red-200"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        {success ? <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
      </ModuleShell>
    </RequireRole>
  );
}
