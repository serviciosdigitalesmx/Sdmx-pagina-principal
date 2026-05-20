"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { RequireRole } from '@/components/guard/RequireRole';
import { useAuth } from '@/components/guard/use-auth';
import { ModuleShell } from '@/components/dashboard/module-shell';
import { fixService } from '@/services/fixService';
import { Table } from '@white-label/ui';

type CustomerRow = {
  id?: string;
  name?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  tag?: string;
};

type CustomerFormState = {
  name: string;
  phone: string;
  email: string;
};

const initialFormState: CustomerFormState = {
  name: '',
  phone: '',
  email: '',
};

export default function Page() {
  const { role } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CustomerFormState>(initialFormState);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fixService.getCustomers();
        if (!cancelled) setRows(data as CustomerRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar clientes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const created = await fixService.createCustomer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });

      setRows((current) => [created as CustomerRow, ...current]);
      setForm(initialFormState);
      setSuccess('Cliente creado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RequireRole allowed={['owner', 'manager', 'technician']}>
      <ModuleShell
        title="Clientes"
        subtitle="Catálogo de clientes con acceso segmentado por tenant y sucursal."
        icon="fas fa-users"
        actionLabel={role === 'technician' ? 'Solo lectura' : 'Registrar cliente'}
        stats={[
          { label: 'Activos', value: String(rows.length), helper: 'Cargados desde la API real.' },
          { label: 'Etiquetas', value: '1', helper: 'Listo para segmentación comercial.' },
          { label: 'Pendientes', value: loading ? '...' : '0', helper: 'Sin datos simulados.' },
        ]}
        columns={[
          { label: 'Nombre', key: 'name' },
          { label: 'Teléfono', key: 'phone' },
          { label: 'Correo', key: 'email' },
          { label: 'Etiqueta', key: 'tag' },
        ]}
        rows={rows.map((row) => ({
          ...row,
          name: row.name ?? row.full_name ?? '',
        }))}
        emptyTitle={loading ? 'Cargando clientes…' : error ? 'Error al cargar clientes' : 'Clientes listo para integración'}
        emptyCopy={error || 'La vista conserva el patrón de la plataforma y queda lista para consumir datos reales filtrados por tenant y rol.'}
      >
        {role !== 'technician' ? (
          <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-3" onSubmit={handleSubmit}>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                minLength={10}
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="5551234567"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="cliente@correo.com"
              />
            </div>
            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#2c6e9f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#245a82] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Registrando...' : 'Guardar cliente'}
              </button>
              <p className="text-sm text-slate-600">Se crea en el tenant actual y queda aislado por `tenant_id`.</p>
            </div>
          </form>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Table<CustomerRow>
          columns={[
            { label: 'Nombre', key: 'name' },
            { label: 'Teléfono', key: 'phone' },
            { label: 'Correo', key: 'email' },
            { label: 'Etiqueta', key: 'tag' },
          ]}
          rows={rows.map((row) => ({
            ...row,
            name: row.name ?? row.full_name ?? '',
          }))}
          emptyMessage={loading ? 'Cargando clientes…' : 'No hay clientes para mostrar'}
        />
      </ModuleShell>
    </RequireRole>
  );
}
