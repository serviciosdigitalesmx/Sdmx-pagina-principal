'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Edit2, Phone, Mail, Truck, Power, Trash2, X } from 'lucide-react';
import { fixService } from '@/services/fixService';

type SupplierRow = {
  id?: string;
  business_name?: string;
  nombre?: string;
  rfc?: string | null;
  legal_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  direccion?: string | null;
  categories?: string | null;
  payment_terms?: string | null;
  condiciones_pago?: string | null;
  notes?: string | null;
  is_active?: boolean | string | null;
};

type SupplierForm = {
  business_name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  categories: string;
  payment_terms: string;
  notes: string;
};

const INITIAL_FORM: SupplierForm = {
  business_name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  categories: '',
  payment_terms: '',
  notes: '',
};

function supplierName(row: SupplierRow) {
  return row.business_name ?? row.nombre ?? 'Proveedor sin nombre';
}

function supplierPhone(row: SupplierRow) {
  return row.phone ?? row.telefono ?? '';
}

function paymentTerms(row: SupplierRow) {
  return row.payment_terms ?? row.condiciones_pago ?? 'Sin termino';
}

function isActive(row: SupplierRow) {
  return row.is_active === true || row.is_active === 'true';
}

function toForm(row: SupplierRow): SupplierForm {
  return {
    business_name: supplierName(row),
    contact_name: row.contact_name ?? '',
    phone: supplierPhone(row),
    email: row.email ?? '',
    address: row.address ?? row.direccion ?? '',
    categories: row.categories ?? '',
    payment_terms: row.payment_terms ?? row.condiciones_pago ?? '',
    notes: row.notes ?? '',
  };
}

export default function ProveedoresPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SupplierRow[]>([]);
  const [filtered, setFiltered] = useState<SupplierRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [form, setForm] = useState<SupplierForm>(INITIAL_FORM);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await fixService.getSuppliers();
      const list = data as SupplierRow[];
      setRows(list);
      setFiltered(list);
      setError('');
    } catch (err) {
      setRows([]);
      setFiltered([]);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      setFiltered(rows);
      return;
    }
    setFiltered(
      rows.filter((row) =>
        [supplierName(row), row.rfc ?? '', supplierPhone(row), row.email ?? '', row.categories ?? '']
          .join(' ')
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [rows, search]);

  const activeCount = useMemo(() => filtered.filter((row) => isActive(row)).length, [filtered]);

  function openCreate() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setShowForm(true);
  }

  function openEdit(row: SupplierRow) {
    setEditing(row);
    setForm(toForm(row));
    setShowForm(true);
  }

  async function submitSupplier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      const payload = {
        business_name: form.business_name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        categories: form.categories.trim() || null,
        payment_terms: form.payment_terms.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (editing?.id) {
        await fixService.updateSupplier(editing.id, payload);
      } else {
        await fixService.createSupplier(payload);
      }
      setShowForm(false);
      setEditing(null);
      setForm(INITIAL_FORM);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proveedor');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row: SupplierRow) {
    if (!row.id) return;
    try {
      setError('');
      await fixService.updateSupplierStatus(row.id, isActive(row) ? 'inactive' : 'active');
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado');
    }
  }

  async function removeSupplier(row: SupplierRow) {
    if (!row.id) return;
    if (!window.confirm(`Eliminar a ${supplierName(row)}?`)) return;
    try {
      setError('');
      await fixService.deleteSupplier(row.id);
      await loadSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el proveedor');
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Proveedores</h1>
          <p className="mt-1 text-sm text-srf-muted">{filtered.length} visibles · {activeCount} activos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadSuppliers()} className="btn-outline gap-2 inline-flex items-center">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button onClick={openCreate} className="btn-primary gap-2 inline-flex items-center">
            <Plus className="w-4 h-4" />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      {showForm ? (
        <form onSubmit={submitSupplier} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-srf-primary">{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost inline-flex items-center gap-2 text-srf-muted">
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.business_name} onChange={(e) => setForm((current) => ({ ...current, business_name: e.target.value }))} className="input" placeholder="Razón social / nombre" required />
            <input value={form.contact_name} onChange={(e) => setForm((current) => ({ ...current, contact_name: e.target.value }))} className="input" placeholder="Contacto" />
            <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} className="input" placeholder="Teléfono" />
            <input value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} className="input" placeholder="Email" type="email" />
            <input value={form.categories} onChange={(e) => setForm((current) => ({ ...current, categories: e.target.value }))} className="input" placeholder="Categorías" />
            <input value={form.payment_terms} onChange={(e) => setForm((current) => ({ ...current, payment_terms: e.target.value }))} className="input" placeholder="Términos de pago" />
            <textarea value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} className="input min-h-24 md:col-span-2" placeholder="Dirección" />
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="input min-h-24 md:col-span-2" placeholder="Notas" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar proveedor'}</button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-srf-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Buscar por nombre, RFC, categoria o contacto..." />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((supplier) => (
          <div key={supplier.id} className="card card-hover space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-srf-primary">{supplierName(supplier)}</h3>
                <p className="text-xs text-srf-muted">{supplier.rfc || 'RFC sin capturar'}</p>
              </div>
              <span className={isActive(supplier) ? 'badge-listo' : 'badge-cancelado'}>{isActive(supplier) ? 'Activo' : 'Inactivo'}</span>
            </div>

            <div className="grid gap-2 text-sm text-srf-muted">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-srf-primary" /><span>{supplier.categories || 'Sin categorias'}</span></div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-srf-primary" /><span>{supplierPhone(supplier) || 'Sin telefono'}</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-srf-primary" /><span>{supplier.email || 'Sin email'}</span></div>
            </div>

            <div className="rounded-lg border border-srf-primary/20 bg-srf-bg/40 p-3 text-sm">
              <div className="text-srf-muted">Terminos de pago</div>
              <div className="mt-1 text-srf-text">{paymentTerms(supplier)}</div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-srf-muted">{supplier.address ?? supplier.direccion ?? 'Direccion no capturada'}</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-ghost inline-flex items-center gap-2 text-srf-primary" onClick={() => openEdit(supplier)}>
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button className="btn-ghost inline-flex items-center gap-2 text-amber-300" onClick={() => void toggleStatus(supplier)}>
                  <Power className="w-4 h-4" />
                  {isActive(supplier) ? 'Desactivar' : 'Activar'}
                </button>
                <button className="btn-ghost inline-flex items-center gap-2 text-red-400" onClick={() => void removeSupplier(supplier)}>
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-srf-muted">No hay proveedores con esos filtros.</div>
      ) : null}
    </div>
  );
}
