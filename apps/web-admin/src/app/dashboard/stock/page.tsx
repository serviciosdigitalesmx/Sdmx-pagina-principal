"use client";

import { useEffect, useState } from 'react';
import { RequireRole } from '@/components/guard/RequireRole';
import { useAuth } from '@/components/guard/use-auth';
import { ModuleShell } from '@/components/dashboard/module-shell';
import { fixService } from '@/services/fixService';
import { Table } from '@srfix/ui';

type InventoryRow = {
  id?: string;
  sku?: string;
  description?: string;
  stock?: number;
  estado?: string;
};

export default function Page() {
  const { role } = useAuth();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fixService.getInventory();
        if (!cancelled) setRows(data as InventoryRow[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar inventario');
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
        title="Inventario"
        subtitle="Control de stock, existencias y alertas de reposición por tenant."
        icon="fas fa-boxes-stacked"
        actionLabel={role === 'technician' ? 'Solo lectura' : '+ Nuevo artículo'}
        stats={[
          { label: 'Artículos', value: String(rows.length), helper: 'Cargados desde la API real.' },
          { label: 'Bajo stock', value: '0', helper: 'Pendiente de reglas y alertas.' },
          { label: 'Sucursales', value: loading ? '...' : '0', helper: 'Filtrado por tenant y sucursal.' },
        ]}
        columns={[
          { label: 'SKU', key: 'sku' },
          { label: 'Descripción', key: 'description' },
          { label: 'Stock', key: 'stock' },
          { label: 'Estado', key: 'estado' },
        ]}
        rows={[]}
        emptyTitle={loading ? 'Cargando inventario…' : error ? 'Error al cargar inventario' : 'Inventario listo para integración'}
        emptyCopy={error || 'La pantalla queda preparada para CRUD y consultas filtradas por tenant_id, con guardas de rol en frontend y backend.'}
      >
        <Table<InventoryRow>
          columns={[
            { label: 'SKU', key: 'sku' },
            { label: 'Descripción', key: 'description' },
            { label: 'Stock', key: 'stock' },
            { label: 'Estado', key: 'estado' },
          ]}
          rows={rows}
          emptyMessage={loading ? 'Cargando inventario…' : 'No hay inventario para mostrar'}
        />
        {role !== 'technician' ? (
          <div className="mt-6 flex gap-3">
            <button className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">Editar inventario</button>
            <button className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200">Ajustar stock</button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            El rol technician tiene acceso de solo lectura.
          </div>
        )}
      </ModuleShell>
    </RequireRole>
  );
}
