"use client";

import { useEffect, useState } from 'react';
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

export default function Page() {
  const { role } = useAuth();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <RequireRole allowed={['owner', 'manager', 'technician']}>
      <ModuleShell
        title="Clientes"
        subtitle="Catálogo de clientes con acceso segmentado por tenant y sucursal."
        icon="fas fa-users"
        actionLabel={role === 'technician' ? 'Solo lectura' : '+ Nuevo cliente'}
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
        rows={[]}
        emptyTitle={loading ? 'Cargando clientes…' : error ? 'Error al cargar clientes' : 'Clientes listo para integración'}
        emptyCopy={error || 'La vista conserva el patrón de la plataforma y queda lista para consumir datos reales filtrados por tenant y rol.'}
      >
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
