'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Building2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { readSession } from '@/lib/session';
import type { SupplierDto } from '@sdmx/contracts';

type SupplierForm = {
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const emptyForm: SupplierForm = {
  name: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  notes: ''
};

export default function ProveedoresPage() {
  const session = readSession();
  const tenantId = session?.shop.id ?? '';

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);

  const editingSupplier = useMemo(
    () => suppliers.find((item) => item.id === editingId) ?? null,
    [editingId, suppliers]
  );

  const loadSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<SupplierDto[]>('/api/suppliers');
      if (res.success && res.data) {
        setSuppliers(res.data);
      } else {
        setError(res.error?.message || 'No se pudieron cargar los proveedores');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  useEffect(() => {
    if (!editingSupplier) return;
    setForm({
      name: editingSupplier.name || '',
      contactName: editingSupplier.contact_name || '',
      phone: editingSupplier.phone || '',
      email: editingSupplier.email || '',
      address: editingSupplier.address || '',
      notes: editingSupplier.notes || ''
    });
  }, [editingSupplier]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const response = await apiClient.patch<SupplierDto>(`/api/suppliers/${editingId}`, {
          name: form.name,
          contactName: form.contactName || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          notes: form.notes || null
        });
        if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo actualizar el proveedor');
      } else {
        const response = await apiClient.post<SupplierDto>('/api/suppliers', {
          tenantId,
          name: form.name,
          contactName: form.contactName || null,
          phone: form.phone || null,
          email: form.email || null,
          address: form.address || null,
          notes: form.notes || null
        });
        if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo crear el proveedor');
      }

      resetForm();
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.delete<{ deleted: true }>(`/api/suppliers/${id}`);
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo eliminar el proveedor');
      if (editingId === id) resetForm();
      await loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el proveedor');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (supplier: SupplierDto) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || '',
      contactName: supplier.contact_name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || ''
    });
  };

  return (
    <SaasShell title="Proveedores" subtitle="Catálogo multi-tenant listo para Compras.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="srf-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Proveedores</h2>
                <p className="text-slate-500 text-sm">Listado real con edición y eliminación.</p>
              </div>
            </div>
            <button onClick={loadSuppliers} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
              ))}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-400">
              No hay proveedores registrados todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {suppliers.map((supplier) => (
                <article key={supplier.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Proveedor</div>
                      <h3 className="mt-2 text-lg font-black text-white">{supplier.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">{supplier.contact_name || 'Sin contacto principal'}</p>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                        {supplier.phone ? <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">{supplier.phone}</span> : null}
                        {supplier.email ? <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1">{supplier.email}</span> : null}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(supplier)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(supplier.id)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {supplier.address ? <p className="mt-4 text-sm text-slate-500">{supplier.address}</p> : null}
                  {supplier.notes ? <p className="mt-2 text-sm text-slate-500">{supplier.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="srf-card p-6 md:p-8 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
              <p className="text-slate-500 text-sm">Datos persistentes en Supabase vía API.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Nombre *</label>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Distribuidora MX"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Contacto</label>
              <input
                value={form.contactName}
                onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Teléfono</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                  placeholder="+52 55 0000 0000"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Email</label>
                <input
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                  placeholder="ventas@proveedor.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Dirección</label>
              <textarea
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Calle, colonia, ciudad"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Notas</label>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Condiciones comerciales, observaciones, etc."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F7EDC] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {saving ? 'Guardando...' : editingId ? 'Actualizar proveedor' : 'Crear proveedor'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </SaasShell>
  );
}
