import { ModuleShell } from '@/components/dashboard/module-shell';

export default function ArchivoPage() {
  return (
    <ModuleShell
      title="Archivo"
      subtitle="Historial de órdenes cerradas, entregadas y listas para consulta avanzada."
      icon="fas fa-archive"
      actionLabel="Buscar archivo"
      stats={[
        { label: 'Órdenes cerradas', value: '0', helper: 'Resultado real cuando se conecte la búsqueda.' },
        { label: 'Rango disponible', value: 'N/D', helper: 'Pendiente de backend y filtros por fecha.' },
        { label: 'Exportaciones', value: '0', helper: 'Listo para conectar CSV o PDF.' },
      ]}
      columns={[
        { label: 'Folio', key: 'folio' },
        { label: 'Cliente', key: 'cliente' },
        { label: 'Fecha cierre', key: 'cierre' },
        { label: 'Estado', key: 'estado' },
      ]}
      rows={[]}
      emptyTitle="Archivo histórico preparado, aún sin conexión"
      emptyCopy="La pantalla queda lista para búsquedas por folio, cliente, fechas y sucursal. No se incluyen registros ficticios ni resultados mock."
    />
  );
}
