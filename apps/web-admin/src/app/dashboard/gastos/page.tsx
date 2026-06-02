 "use client";

import { useEffect, useMemo, useState } from 'react';
import { RequireRole } from '@/components/guard/RequireRole';
import { useAuth } from '@/components/guard/use-auth';
import { ModuleShell } from '@/components/dashboard/module-shell';
import { getActiveScope } from '@/lib/scope';
import { fixService } from '@/services/fixService';

export default function GastosPage() {
  const { role } = useAuth();
  const scope = getActiveScope();
  const activeSucursalId = scope?.sucursalId ?? "";
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setLoading(true);
      setError('');
      if (!activeSucursalId) {
        throw new Error('Sucursal activa requerida');
      }
      const data = await fixService.getCashflow(activeSucursalId);
      setRows(
        (data as Array<Record<string, unknown>>).map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, value == null ? '' : String(value)])
          ) as Record<string, string>
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Error al cargar gastos');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeSucursalId]);

  const stats = useMemo(
    () => [
      { label: 'Movimientos', value: String(rows.length), helper: 'Datos reales de cashflow.' },
      { label: 'Sucursal', value: activeSucursalId || 'No disponible', helper: 'Contexto obligatorio.' },
      { label: 'Rol', value: role, helper: 'Permisos reales por usuario.' },
    ],
    [activeSucursalId, role, rows.length]
  );

  return (
    <RequireRole allowed={['owner', 'manager']}>
      <ModuleShell
        title="Gastos"
        subtitle="Registro y control de egresos del taller."
        icon="fas fa-receipt"
        actionLabel="+ Registrar gasto"
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void refresh()}
        stats={stats}
        columns={[
          { label: 'ID', key: 'id' },
          { label: 'Sucursal', key: 'sucursal_id' },
          { label: 'Ingreso', key: 'income' },
          { label: 'Egreso', key: 'expense' },
        ]}
        rows={rows}
        loading={loading}
        emptyTitle={loading ? 'Cargando gastos…' : error ? 'No pudimos cargar gastos' : 'Sin movimientos de gasto todavía'}
        emptyCopy={error || 'Aquí verás los egresos del taller por sucursal.'}
      />
    </RequireRole>
  );
}
