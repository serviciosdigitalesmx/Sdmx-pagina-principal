import { ModuleShell } from '@/components/dashboard/module-shell';

export default function TareasPage() {
  return (
    <ModuleShell
      title="Tareas"
      subtitle="Vista operativa para asignaciones, seguimiento y productividad del equipo."
      icon="fas fa-tasks"
      actionLabel="+ Nueva tarea"
      stats={[
        { label: 'Abiertas', value: '0', helper: 'Sin tareas conectadas.' },
        { label: 'En proceso', value: '0', helper: 'Kanban listo para integrar.' },
        { label: 'Completadas', value: '0', helper: 'Pendiente de datos reales.' },
      ]}
      columns={[
        { label: 'Folio', key: 'folio' },
        { label: 'Responsable', key: 'responsable' },
        { label: 'Estado', key: 'estado' },
        { label: 'Prioridad', key: 'prioridad' },
      ]}
      rows={[]}
      emptyTitle="Tablero operativo sin datos"
      emptyCopy="Esta ruta queda preparada para una experiencia tipo lista o Kanban, pero la persistencia real se conectará después para respetar tenant_id, permisos y trazabilidad."
    />
  );
}
