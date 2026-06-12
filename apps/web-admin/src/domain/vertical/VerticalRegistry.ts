import type { VerticalConfig } from './VerticalConfig';
import { DEFAULT_VERTICAL_CONFIG } from './VerticalConfig';

export const VERTICALS: Record<string, VerticalConfig> = {
  talleres: {
    code: 'talleres',
    name: 'Taller de Reparación',
    labels: {
      branch: 'Sucursal',
      order: 'Orden',
      customer: 'Cliente',
      technician: 'Técnico',
      asset: 'Equipo',
    },
    enabledModules: ['orders', 'customers', 'inventory', 'tasks', 'reports'],
    workflowStatuses: DEFAULT_VERTICAL_CONFIG.workflowStatuses,
    statusOptions: DEFAULT_VERTICAL_CONFIG.statusOptions,
  },

  barberias: {
    code: 'barberias',
    name: 'Barbería',
    labels: {
      branch: 'Sucursal',
      order: 'Cita',
      customer: 'Cliente',
      technician: 'Barbero',
      asset: 'Servicio',
    },
    enabledModules: ['orders', 'customers', 'tasks', 'reports'],
    workflowStatuses: [
      { key: 'scheduled', label: 'Agendada', tone: 'neutral', isDefault: true },
      { key: 'in_service', label: 'En servicio', tone: 'info' },
      { key: 'finished', label: 'Finalizada', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelada', tone: 'danger', isTerminal: true },
    ],
    statusOptions: {
      orders: [
        { key: 'scheduled', label: 'Agendada', tone: 'neutral', isDefault: true },
        { key: 'in_service', label: 'En servicio', tone: 'info' },
        { key: 'finished', label: 'Finalizada', tone: 'success', isTerminal: true },
        { key: 'cancelled', label: 'Cancelada', tone: 'danger', isTerminal: true },
      ],
    },
  },

  hvac: {
    code: 'hvac',
    name: 'Climas y Refrigeración',
    labels: {
      branch: 'Sucursal',
      order: 'Servicio',
      customer: 'Cliente',
      technician: 'Técnico',
      asset: 'Equipo',
    },
    enabledModules: ['orders', 'customers', 'inventory', 'tasks', 'procurement', 'reports'],
    workflowStatuses: [
      { key: 'scheduled', label: 'Programado', tone: 'neutral', isDefault: true },
      { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
      { key: 'repairing', label: 'En reparación', tone: 'warning' },
      { key: 'completed', label: 'Completado', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
    ],
    statusOptions: {
      orders: [
        { key: 'scheduled', label: 'Programado', tone: 'neutral', isDefault: true },
        { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
        { key: 'repairing', label: 'En reparación', tone: 'warning' },
        { key: 'completed', label: 'Completado', tone: 'success', isTerminal: true },
        { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
      ],
    },
  },

  mecanicos: {
    code: 'mecanicos',
    name: 'Taller Mecánico',
    labels: {
      branch: 'Sucursal',
      order: 'Orden',
      customer: 'Cliente',
      technician: 'Mecánico',
      asset: 'Vehículo',
    },
    enabledModules: ['orders', 'customers', 'inventory', 'tasks', 'procurement', 'reports'],
    workflowStatuses: [
      { key: 'received', label: 'Recibido', tone: 'neutral', isDefault: true },
      { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
      { key: 'waiting_parts', label: 'Esperando refacciones', tone: 'warning' },
      { key: 'in_repair', label: 'En reparación', tone: 'warning' },
      { key: 'ready', label: 'Listo', tone: 'success' },
      { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
    ],
    statusOptions: {
      orders: [
        { key: 'received', label: 'Recibido', tone: 'neutral', isDefault: true },
        { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
        { key: 'waiting_parts', label: 'Esperando refacciones', tone: 'warning' },
        { key: 'in_repair', label: 'En reparación', tone: 'warning' },
        { key: 'ready', label: 'Listo', tone: 'success' },
        { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
        { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
      ],
    },
  },

  rentas: {
    code: 'rentas',
    name: 'Renta de Equipos',
    labels: {
      branch: 'Sucursal',
      order: 'Renta',
      customer: 'Cliente',
      technician: 'Responsable',
      asset: 'Equipo',
    },
    enabledModules: ['orders', 'customers', 'inventory', 'finance', 'reports'],
    workflowStatuses: [
      { key: 'draft', label: 'Borrador', tone: 'neutral', isDefault: true },
      { key: 'reserved', label: 'Reservada', tone: 'info' },
      { key: 'active', label: 'Activa', tone: 'warning' },
      { key: 'returned', label: 'Devuelta', tone: 'success', isTerminal: true },
      { key: 'closed', label: 'Cerrada', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelada', tone: 'danger', isTerminal: true },
    ],
    statusOptions: {
      orders: [
        { key: 'draft', label: 'Borrador', tone: 'neutral', isDefault: true },
        { key: 'reserved', label: 'Reservada', tone: 'info' },
        { key: 'active', label: 'Activa', tone: 'warning' },
        { key: 'returned', label: 'Devuelta', tone: 'success', isTerminal: true },
        { key: 'closed', label: 'Cerrada', tone: 'success', isTerminal: true },
        { key: 'cancelled', label: 'Cancelada', tone: 'danger', isTerminal: true },
      ],
    },
  },

  electronica: {
    code: 'electronica',
    name: 'Electrónica',
    labels: {
      branch: 'Sucursal',
      order: 'Orden',
      customer: 'Cliente',
      technician: 'Técnico',
      asset: 'Dispositivo',
    },
    enabledModules: ['orders', 'customers', 'inventory', 'tasks', 'procurement', 'reports'],
    workflowStatuses: [
      { key: 'received', label: 'Recibido', tone: 'neutral', isDefault: true },
      { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
      { key: 'repairing', label: 'En reparación', tone: 'warning' },
      { key: 'awaiting_parts', label: 'Esperando piezas', tone: 'warning' },
      { key: 'ready', label: 'Listo', tone: 'success' },
      { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
    ],
    statusOptions: {
      orders: [
        { key: 'received', label: 'Recibido', tone: 'neutral', isDefault: true },
        { key: 'diagnosing', label: 'Diagnóstico', tone: 'info' },
        { key: 'repairing', label: 'En reparación', tone: 'warning' },
        { key: 'awaiting_parts', label: 'Esperando piezas', tone: 'warning' },
        { key: 'ready', label: 'Listo', tone: 'success' },
        { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
        { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
      ],
    },
  },
};

export function resolveVertical(
  industryKey?: string | null,
): VerticalConfig {
  if (!industryKey) {
    return DEFAULT_VERTICAL_CONFIG;
  }

  return (
    VERTICALS[industryKey] ??
    DEFAULT_VERTICAL_CONFIG
  );
}
