import { ModuleShell } from '@/components/dashboard/module-shell';

export default function ProveedoresPage() {
  return (
    <ModuleShell
      title="Proveedores"
      subtitle="Catálogo de proveedores, distribuidores y condiciones comerciales del tenant actual."
      icon="fas fa-truck"
      actionLabel="+ Nuevo proveedor"
      stats={[
        { label: 'Activos', value: '0', helper: 'Pendiente de conexión con Supabase.' },
        { label: 'Crédito', value: '0 MXN', helper: 'Sin datos cargados todavía.' },
        { label: 'Última alta', value: 'N/D', helper: 'Se mostrará cuando exista API real.' },
      ]}
      columns={[]}
      rows={[]}
      emptyTitle="Catálogo sin registros conectados"
      emptyCopy="Aquí se listarán los proveedores reales del tenant, con razón social, contacto, condiciones de pago y relación con compras. En esta fase solo dejamos la estructura lista para enlazar la API."
    />
  );
}
