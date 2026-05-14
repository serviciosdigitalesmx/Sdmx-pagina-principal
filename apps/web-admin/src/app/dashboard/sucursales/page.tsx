import { ModuleShell } from '@/components/dashboard/module-shell';

export default function SucursalesPage() {
  return (
    <ModuleShell
      title="Sucursales"
      subtitle="Administración de puntos de venta, reparación y operación del tenant actual."
      icon="fas fa-store"
      actionLabel="+ Añadir sucursal"
      stats={[
        { label: 'Sucursales', value: '0', helper: 'Sin puntos de venta sincronizados.' },
        { label: 'Activas', value: '0', helper: 'Se calculará con datos reales.' },
        { label: 'Matriz', value: 'N/D', helper: 'Pendiente de configuración multi-tenant.' },
      ]}
      columns={[
        { label: 'Nombre', key: 'nombre' },
        { label: 'Ciudad', key: 'ciudad' },
        { label: 'Estado', key: 'estado' },
        { label: 'Permisos', key: 'permisos' },
      ]}
      rows={[]}
      emptyTitle="Gestión de sucursales lista para CRUD real"
      emptyCopy="Esta vista ya está preparada para administrar sucursales con validación, permisos y segmentación por tenant. No se muestran registros inventados."
    />
  );
}
