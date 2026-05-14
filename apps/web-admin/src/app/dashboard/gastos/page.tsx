import { ModuleShell } from '@/components/dashboard/module-shell';

export default function GastosPage() {
  return (
    <ModuleShell
      title="Gastos"
      subtitle="Registro y control de egresos operativos, administrativos y extraordinarios."
      icon="fas fa-receipt"
      actionLabel="+ Registrar gasto"
      stats={[
        { label: 'Mes actual', value: '0 MXN', helper: 'Sin movimientos sincronizados.' },
        { label: 'Categorías', value: '0', helper: 'Estructura lista para clasificación.' },
        { label: 'Pendientes', value: '0', helper: 'No hay flujos reales aún.' },
      ]}
      columns={[
        { label: 'Fecha', key: 'fecha' },
        { label: 'Categoría', key: 'categoria' },
        { label: 'Concepto', key: 'concepto' },
        { label: 'Monto', key: 'monto' },
      ]}
      rows={[]}
      emptyTitle="Registro de egresos pendiente de integración"
      emptyCopy="Esta pantalla queda preparada para capturar gastos con validación de backend, tenant_id y categorización real. No se muestran datos simulados."
    />
  );
}
