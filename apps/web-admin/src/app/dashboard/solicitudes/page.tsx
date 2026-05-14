import { ModuleShell } from '@/components/dashboard/module-shell';

export default function SolicitudesPage() {
  return (
    <ModuleShell
      title="Solicitudes"
      subtitle="Buzón operativo para garantías, traspasos, incidencias y peticiones internas."
      icon="fas fa-envelope-open-text"
      actionLabel="+ Nueva solicitud"
      stats={[
        { label: 'Pendientes', value: '0', helper: 'Sin solicitudes reales cargadas.' },
        { label: 'En revisión', value: '0', helper: 'Flujo preparado para estados.' },
        { label: 'Resueltas', value: '0', helper: 'Listo para trazabilidad de atención.' },
      ]}
      columns={[
        { label: 'Folio', key: 'folio' },
        { label: 'Tipo', key: 'tipo' },
        { label: 'Sucursal', key: 'sucursal' },
        { label: 'Estado', key: 'estado' },
      ]}
      rows={[]}
      emptyTitle="Buzón de solicitudes sin sincronización"
      emptyCopy="Se dejó la estructura para gestionar peticiones entre sucursales y garantías con estados reales, sin simular tickets ni respuestas."
    />
  );
}
