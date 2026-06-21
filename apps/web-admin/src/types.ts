// Tipos base
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'manager' | 'technician' | 'client';
  tenantId: string;
  tenantSlug: string;
  sucursalId: string | null;
  sessionId?: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  branding: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  trial_expires_at: string;
  billing_exempt: boolean;
}

export interface Sucursal {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email?: string | null;
  is_active: boolean;
}

// Módulos del dashboard
export interface DashboardModule {
  key: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  { key: 'operativo', label: 'Recepción', icon: 'ClipboardList', href: '/dashboard/operativo', enabled: true },
  { key: 'tecnico', label: 'Técnico', icon: 'Wrench', href: '/dashboard/tecnico', enabled: true },
  { key: 'solicitudes', label: 'Solicitudes', icon: 'FileText', href: '/dashboard/solicitudes', enabled: true },
  { key: 'archivo', label: 'Archivo', icon: 'Archive', href: '/dashboard/archivo', enabled: true },
  { key: 'landing', label: 'Landing', icon: 'Globe', href: '/dashboard/landing', enabled: true },
  { key: 'clientes', label: 'Clientes', icon: 'Users', href: '/dashboard/clientes', enabled: true },
  { key: 'tareas', label: 'Tareas', icon: 'CheckSquare', href: '/dashboard/tareas', enabled: true },
  { key: 'stock', label: 'Stock', icon: 'Package', href: '/dashboard/stock', enabled: true },
  { key: 'proveedores', label: 'Proveedores', icon: 'Truck', href: '/dashboard/proveedores', enabled: true },
  { key: 'compras', label: 'Compras', icon: 'ShoppingCart', href: '/dashboard/compras', enabled: true },
  { key: 'gastos', label: 'Gastos', icon: 'Wallet', href: '/dashboard/gastos', enabled: true },
  { key: 'finanzas', label: 'Finanzas', icon: 'LineChart', href: '/dashboard/finanzas', enabled: true },
  { key: 'reportes', label: 'Reportes', icon: 'BarChart3', href: '/dashboard/reportes', enabled: true },
  { key: 'movivendor', label: 'Movivendor', icon: 'CircleDollarSign', href: '/dashboard/movivendor', enabled: true },
  { key: 'sucursales', label: 'Sucursales', icon: 'Building2', href: '/dashboard/sucursales', enabled: true },
  { key: 'seguridad', label: 'Seguridad', icon: 'Shield', href: '/dashboard/seguridad', enabled: true },
];

// Tipos de órdenes
export interface Order {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  customer_id: string | null;
  customers?: Customer | null;
  folio: string;
  status: string;
  device_info: {
    type?: string;
    brand?: string;
    model?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    serial_number?: string | null;
  };
  problem_description: string;
  serial_number?: string | null;
  estimated_cost: number;
  final_cost: number;
  promised_date: string | null;
  receipt_url: string | null;
  warranty_until: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown>;
  evidence_metadata: unknown[];
  assigned_user_id: string | null;
  created_at: string;
  updated_at: string;
  // Campos calculados
  diasRestantes?: number;
  color?: 'rojo' | 'amarillo' | 'verde' | 'gris';
  operational_risk?: {
    color: string;
    reason: string;
    suggested_action: string;
    elapsed_minutes: number | null;
  };
}

export interface OrderChecklist {
  id: string;
  tenant_id: string;
  service_order_id: string;
  has_charger: boolean;
  screen_condition: string | null;
  powers_on: boolean;
  backup_required: boolean;
  notes: string | null;
  cosmetic_condition: string | null;
  reported_physical_damage: string | null;
  accessories_received: string | null;
  customer_acceptance_required: boolean;
  accepted_at: string | null;
  accepted_by_name: string | null;
}

export interface OrderDocument {
  id: string;
  file_name: string;
  file_type: string;
  public_url: string | null;
  mime_type: string;
  created_at: string;
}

export interface OrderEvent {
  id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  note: string | null;
  actor_name: string | null;
  created_at: string;
}

// Tipos de solicitudes
export interface ServiceRequest {
  id: string;
  tenant_id: string;
  folio: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  device_type: string;
  device_model: string;
  issue_description: string;
  urgency: string;
  status: string;
  quoted_total: number;
  deposit_amount: number;
  balance_amount: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Tipos de clientes
export interface Customer {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  name: string;
  full_name?: string | null;
  phone: string;
  email: string | null;
  created_at: string;
}

export interface CustomerHistory {
  totalEquipos: number;
  totalReparaciones: number;
  totalCotizaciones: number;
  ticketPromedio: number;
  ultimaVisita: string | null;
  equipos: Array<{
    FOLIO: string;
    TIPO: string;
    MODELO: string;
    FALLA: string;
    DIAGNOSTICO: string;
    ESTADO: string;
    FECHA_INGRESO: string;
    FECHA_ENTREGA: string | null;
    COSTO_ESTIMADO: number;
  }>;
  cotizaciones: Array<{
    folio: string;
    dispositivo: string;
    modelo: string;
    descripcion: string;
    problemas: string;
    total: number;
    estado: string;
  }>;
}

export interface MovivendorActivationRequest {
  id: string;
  tenant_id: string;
  tenant_slug: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'active' | 'suspended';
  review_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovivendorAccount {
  id: string;
  tenant_id: string;
  movivendor_user: string;
  movivendor_ident: string;
  movivendor_terminal: string;
  token_expires_at: string | null;
  status: 'pending' | 'active' | 'credentials_error' | 'suspended';
  last_validation_error: string | null;
  last_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MovivendorTransaction {
  id: string;
  tenant_id: string;
  user_id: string | null;
  external_id: string;
  product: string;
  subprod: string | null;
  destination: string;
  amount: number;
  confirmation: string | null;
  trace: string | null;
  pin: string | null;
  customer_balance: number | null;
  status: 'pending' | 'checking' | 'approved' | 'rejected' | 'failed' | 'voided';
  response_code: string | null;
  response_message: string | null;
  raw_request: Record<string, unknown>;
  raw_response: Record<string, unknown>;
  payment_method: string | null;
  branch_id: string | null;
  commission: number | null;
  created_at: string;
  updated_at: string;
}

// Tipos de tareas
export interface Task {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  service_order_id: string | null;
  service_request_id: string | null;
  title: string;
  description: string | null;
  status: 'pendiente' | 'en_proceso' | 'bloqueada' | 'hecha';
  priority: 'baja' | 'media' | 'alta';
  assigned_user_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos de stock
export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  category: string | null;
  brand: string | null;
  proveedor?: string | null;
  compatible_model: string | null;
  primary_supplier_id: string | null;
  cost: number;
  sale_price: number;
  minimum_stock: number;
  unit: string | null;
  location: string | null;
  notes: string | null;
  is_active: boolean;
  stock_current?: number;
  alerta_nivel?: 'bajo' | 'critico' | 'agotado';
  alerta_stock?: boolean;
}

export interface InventoryItem {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  product_id: string;
  stock_current: number;
  sku?: string;
  description?: string;
}

export interface InventoryMovement {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  product_id: string;
  service_order_id: string | null;
  purchase_order_id: string | null;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface StockAlert {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  product_id: string;
  severity: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

// Tipos de proveedores
export interface Supplier {
  id: string;
  tenant_id: string;
  business_name: string;
  rfc: string | null;
  legal_name: string | null;
  contact_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  categories: string | null;
  lead_time_days: number | null;
  payment_terms: string | null;
  price_score: number;
  speed_score: number;
  quality_score: number;
  reliability_score: number;
  notes: string | null;
  is_active: boolean;
}

// Tipos de compras
export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  supplier_id: string | null;
  folio: string;
  status: 'borrador' | 'emitida' | 'recepcion_parcial' | 'recibida' | 'cancelada';
  reference: string | null;
  payment_terms: string | null;
  expected_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string | null;
  sku_snapshot: string | null;
  product_name_snapshot: string | null;
  qty_ordered: number;
  qty_received: number;
  unit_cost: number;
  subtotal: number;
}

// Tipos de finanzas
export interface FinanceBalance {
  id: string;
  tenant_id: string;
  balance: number;
  income: number;
  expense: number;
  created_at: string;
  type?: 'summary' | 'order' | 'expense';
}

export interface FinanceSummary {
  ingresos: number;
  egresos: number;
  utilidadBruta: number;
  ticketPromedio: number;
  ordenesEntregadas: number;
  cotizacionesConvertidas: number;
  cuentasPorCobrar: number;
  anticiposPendientes: number;
  comparativoMensual: Array<{
    mes: string;
    ingresos: number;
    egresos: number;
    utilidad: number;
  }>;
  resumenCategorias: Array<{
    categoria: string;
    total: number;
  }>;
}

// Tipos de reportes
export interface ReportsSummary {
  ordersCount: number;
  customersCount: number;
  inventoryCount: number;
  lowStockCount: number;
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  productivity: number;
  inventoryValuation: number;
  accountsReceivable: number;
  ordersByTechnician: Record<string, number>;
  ordersBySucursal: Record<string, number>;
  statusCounts: Record<string, number>;
  statusCountsToday: Record<string, number>;
  statusCountsWeek: Record<string, number>;
  topProductsUsed: Array<{ productId: string; name: string; quantity: number }>;
  overduePromisedOrders: Array<{
    id: string;
    folio: string | null;
    status: string | null;
    promisedDate: string | null;
    createdAt: string | null;
  }>;
}

// Tipos de gastos
export interface Expense {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  supplier_id: string | null;
  expense_type: string;
  category: string;
  concept: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  receipt_url: string | null;
  notes: string | null;
  expense_date: string;
  created_at: string;
}

// Tipos de seguridad
export interface SecurityUser {
  id: string;
  tenantId: string;
  authUserId: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  activo: boolean;
  ultimo_acceso: string | null;
  sucursalId: string | null;
  createdAt: string;
}

export interface SecurityConfig {
  adminPasswordConfigured: boolean;
  mensajeAutorizacion: string;
  bitacoraActiva: boolean;
  acciones: Array<{
    clave: string;
    titulo: string;
    descripcion: string;
    accion: string;
    requiereAdmin: boolean;
  }>;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  data_before: Record<string, unknown> | null;
  data_after: Record<string, unknown> | null;
  created_at: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  sessionKey: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActivityAt: string;
  createdAt: string;
  user: SecurityUser | null;
}
