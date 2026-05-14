import { RequireRole } from '@/components/guard/RequireRole';
import { ModuleShell } from '@/components/dashboard/module-shell';

export default function Page() {
  return (
    <RequireRole allowed={['owner', 'manager']}>
      <ModuleShell
        title="Finanzas"
        subtitle="Balances, flujo de efectivo y reportes financieros del tenant."
        icon="fas fa-chart-line"
        actionLabel="Ver reporte"
        stats={[
          { label: 'Balance', value: '0 MXN', helper: 'Solo visible para owner/manager.' },
          { label: 'Movimientos', value: '0', helper: 'Sin datos conectados.' },
          { label: 'Sucursales', value: '0', helper: 'Filtrado por permisos.' },
        ]}
        columns={[
          { label: 'Fecha', key: 'fecha' },
          { label: 'Sucursal', key: 'sucursal' },
          { label: 'Ingreso', key: 'ingreso' },
          { label: 'Egreso', key: 'egreso' },
        ]}
        rows={[]}
        emptyTitle="Finanzas bloqueado por permisos y sin datos"
        emptyCopy="Esta vista solo es accesible para owner y manager. Ya está preparada para leer de /api/:tenantId/finance con validación de sucursal."
      />
    </RequireRole>
  );
}
