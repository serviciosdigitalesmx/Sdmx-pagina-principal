export interface VerticalConfig {
  code: string;
  name: string;
  labels: {
    branch: string;
    order: string;
    customer: string;
    technician: string;
    asset: string;
  };
  enabledModules?: string[];
  workflowStatuses?: Array<{
    key: string;
    label: string;
    tone?: string | null;
    isDefault?: boolean;
    isTerminal?: boolean;
  }>;
  statusOptions?: Record<
    string,
    Array<{
      key: string;
      label: string;
      tone?: string | null;
      isDefault?: boolean;
      isTerminal?: boolean;
    }>
  >;
}

export const DEFAULT_VERTICAL_CONFIG: VerticalConfig = {
  code: 'repair_shop',
  name: 'Taller de reparación',
  labels: {
    branch: 'Sucursal',
    order: 'Orden',
    customer: 'Cliente',
    technician: 'Técnico',
    asset: 'Equipo',
  },
  enabledModules: ['orders', 'customers', 'inventory', 'tasks', 'reports'],
  workflowStatuses: [
    { key: 'new', label: 'Nuevo', tone: 'neutral', isDefault: true },
    { key: 'in_progress', label: 'En proceso', tone: 'info' },
    { key: 'ready', label: 'Listo', tone: 'success' },
    { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
    { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
  ],
  statusOptions: {
    orders: [
      { key: 'new', label: 'Nuevo', tone: 'neutral', isDefault: true },
      { key: 'in_progress', label: 'En proceso', tone: 'info' },
      { key: 'ready', label: 'Listo', tone: 'success' },
      { key: 'delivered', label: 'Entregado', tone: 'success', isTerminal: true },
      { key: 'cancelled', label: 'Cancelado', tone: 'danger', isTerminal: true },
    ],
  },
};
