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
          { label: 'Pendientes', value: loading ? '...' : '0', helper: 'Pendientes por atender.' },
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
        emptyCopy={error || 'La vista queda lista para mostrar clientes del taller cuando haya registros.'}
      >
        {role !== 'technician' ? (
          <form className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/85 p-5 md:grid-cols-3" onSubmit={handleSubmit}>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400" htmlFor="name">
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Nombre del cliente"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400" htmlFor="phone">
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
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="5551234567"
              />
            </div>
            <div className="md:col-span-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20"
                placeholder="cliente@correo.com"
              />
            </div>
            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Registrando...' : 'Guardar cliente'}
              </button>
              <p className="text-sm text-zinc-400">Se crea en el taller actual y queda aislado.</p>
            </div>
          </form>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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
