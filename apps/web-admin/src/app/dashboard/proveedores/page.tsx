"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type SupplierRow = {
  id?: string;
  business_name?: string;
  legal_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  categories?: string | null;
  lead_time_days?: number | null;
  payment_terms?: string | null;
  is_active?: boolean | string | null;
};

const emptyForm = {
  businessName: "",
  legalName: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  state: "",
  categories: "",
  paymentTerms: "",
  notes: "",
};

export default function ProveedoresPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError("");
      const data = await fixService.getSuppliers();
      setRows(data as SupplierRow[]);
      setSelectedId((current) => current || (data[0] as SupplierRow | undefined)?.id || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const selected = useMemo(() => rows.find((item) => item.id === selectedId) ?? null, [rows, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      businessName: selected.business_name ?? "",
      legalName: selected.legal_name ?? "",
      contactName: selected.contact_name ?? "",
      phone: selected.phone ?? "",
      whatsapp: selected.whatsapp ?? "",
      email: selected.email ?? "",
      address: "",
      city: selected.city ?? "",
      state: selected.state ?? "",
      categories: selected.categories ?? "",
      paymentTerms: selected.payment_terms ?? "",
      notes: "",
    });
  }, [selected]);

  const stats = useMemo(
    () => [
      { label: "Activos", value: String(rows.filter((item) => item.is_active !== false && item.is_active !== "false").length), helper: "Registros activos." },
      { label: "Totales", value: String(rows.length), helper: "Listado del taller." },
      { label: "Selección", value: selected?.business_name ?? "Ninguno", helper: "Proveedor actual." },
    ],
    [rows, selected],
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        businessName: form.businessName.trim(),
        legalName: form.legalName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        categories: form.categories.trim(),
        paymentTerms: form.paymentTerms.trim(),
        notes: form.notes.trim(),
      };

      if (selected?.id) {
        await fixService.updateSupplier(selected.id, payload);
      } else {
        await fixService.createSupplier(payload);
      }
      setForm(emptyForm);
      setSelectedId("");
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el proveedor");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    try {
      setSaving(true);
      setError("");
      await fixService.deleteSupplier(id);
      await loadSuppliers();
      if (selectedId === id) {
        setSelectedId("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar el proveedor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Proveedores"
        subtitle="Catálogo de proveedores con creación, edición y baja lógica."
        icon="fas fa-truck"
        actionLabel="Nuevo proveedor"
        onAction={() => setSelectedId("")}
        stats={stats}
        columns={[
          { label: "Proveedor", key: "business_name" },
          { label: "Contacto", key: "contact_name" },
          { label: "Ciudad", key: "city" },
          { label: "Estado", key: "is_active" },
        ]}
        rows={rows.map((row) => ({
          business_name: row.business_name ?? "",
          contact_name: row.contact_name ?? "",
          city: row.city ?? "",
          is_active: row.is_active === false || row.is_active === "false" ? "Inactivo" : "Activo",
        }))}
        emptyTitle={loading ? "Cargando proveedores…" : error ? "No pudimos cargar proveedores" : "No hay proveedores registrados"}
        emptyCopy={error || "La lista real sale de /api/:tenantSlug/suppliers."}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-50">{selected?.id ? "Editar proveedor" : "Crear proveedor"}</h2>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["businessName", "Razón social"],
                ["legalName", "Nombre legal"],
                ["contactName", "Contacto"],
                ["phone", "Teléfono"],
                ["whatsapp", "WhatsApp"],
                ["email", "Correo"],
                ["city", "Ciudad"],
                ["state", "Estado"],
                ["categories", "Categorías"],
                ["paymentTerms", "Términos de pago"],
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
              <label className="space-y-1 text-sm text-zinc-300 md:col-span-2">
                <span>Notas</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-28 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
                />
              </label>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </form>

          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-lg font-semibold text-zinc-50">Listado de proveedores</h2>
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id ?? row.business_name}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    row.id === selected?.id ? "border-cyan-400 bg-cyan-400/10" : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(row.id ?? "");
                      setForm({
                        businessName: row.business_name ?? "",
                        legalName: row.legal_name ?? "",
                        contactName: row.contact_name ?? "",
                        phone: row.phone ?? "",
                        whatsapp: row.whatsapp ?? "",
                        email: row.email ?? "",
                        address: "",
                        city: row.city ?? "",
                        state: row.state ?? "",
                        categories: row.categories ?? "",
                        paymentTerms: row.payment_terms ?? "",
                        notes: "",
                      });
                    }}
                    className="w-full text-left"
                  >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-zinc-50">{row.business_name}</div>
                      <div className="text-xs text-zinc-400">{row.contact_name || "Sin contacto"}</div>
                    </div>
                    <div className="text-xs text-zinc-400">{row.is_active === false || row.is_active === "false" ? "Inactivo" : "Activo"}</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{row.city || "Sin ciudad"}</span>
                  </div>
                  </button>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => void handleDeactivate(row.id ?? "")}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200"
                    >
                      Desactivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
