export interface User {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "technician" | "client";
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
  is_active: boolean;
}

export interface DashboardModule {
  key: string;
  label: string;
  icon: string;
  href: string;
  enabled: boolean;
}

export const DASHBOARD_MODULES: DashboardModule[] = [
  { key: "summary", label: "Resumen", icon: "LayoutDashboard", href: "/dashboard", enabled: true },
  { key: "operativo", label: "Recepción", icon: "ClipboardList", href: "/dashboard/ordenes", enabled: true },
  { key: "tecnico", label: "Técnico", icon: "Wrench", href: "/dashboard/tecnico", enabled: true },
  { key: "solicitudes", label: "Solicitudes", icon: "FileText", href: "/dashboard/solicitudes", enabled: true },
  { key: "archivo", label: "Archivo", icon: "Archive", href: "/dashboard/archivo", enabled: true },
  { key: "clientes", label: "Clientes", icon: "Users", href: "/dashboard/clientes", enabled: true },
  { key: "tareas", label: "Tareas", icon: "CheckSquare", href: "/dashboard/tareas", enabled: true },
  { key: "stock", label: "Stock", icon: "Package", href: "/dashboard/stock", enabled: true },
  { key: "proveedores", label: "Proveedores", icon: "Truck", href: "/dashboard/proveedores", enabled: true },
  { key: "compras", label: "Compras", icon: "ShoppingCart", href: "/dashboard/compras", enabled: true },
  { key: "gastos", label: "Gastos", icon: "Wallet", href: "/dashboard/gastos", enabled: true },
  { key: "finanzas", label: "Finanzas", icon: "LineChart", href: "/dashboard/finanzas", enabled: true },
  { key: "reportes", label: "Reportes", icon: "BarChart3", href: "/dashboard/reportes", enabled: true },
  { key: "usuarios", label: "Usuarios", icon: "Users", href: "/dashboard/usuarios", enabled: true },
  { key: "security", label: "Seguridad", icon: "Shield", href: "/dashboard/seguridad", enabled: true },
  { key: "sucursales", label: "Sucursales", icon: "Building2", href: "/dashboard/sucursales", enabled: true },
];

export interface Order {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  customer_id: string | null;
  folio: string;
  status: string;
  device_info: {
    type?: string;
    brand?: string;
    model?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  };
  problem_description: string;
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
  diasRestantes?: number;
  color?: "rojo" | "amarillo" | "verde" | "gris";
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

export interface Customer {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  name: string;
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

export interface Task {
  id: string;
  tenant_id: string;
  sucursal_id: string | null;
  service_order_id: string | null;
  service_request_id: string | null;
  title: string;
  description: string | null;
  status: "pendiente" | "en_proceso" | "bloqueada" | "hecha";
  priority: "baja" | "media" | "alta";
  assigned_user_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  category: string | null;
  brand: string | null;
  compatible_model: string | null;
  primary_supplier_id: string | null;
  cost: number;
  sale_price: number;
  minimum_stock: number;
  stock_current: number;
  sucursal_id: string | null;
  created_at: string;
  updated_at: string;
  proveedor?: string | null;
}

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  stock_current: number;
  minimum_stock: number;
  severity: "bajo" | "critico" | "agotado";
  created_at: string;
}

export interface Expense {
  id: string;
  expense_date: string;
  expense_type: string;
  category: string;
  concepto: string;
  description: string | null;
  amount: number;
  payment_method: string | null;
  proveedor: string | null;
  notes: string | null;
}

export interface SecurityUser {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "technician" | "client";
  activo: boolean;
  sucursal_id: string | null;
}

export interface SecurityConfig {
  mfa_enabled: boolean;
  mfa_required_for_admins: boolean;
  password_rotation_enabled: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  user_email: string | null;
  created_at: string;
}

export interface SecuritySession {
  id: string;
  user_email: string;
  created_at: string;
  last_seen_at: string | null;
}

export interface ReportsSummary {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  productivity: number;
  ordersCount: number;
  customersCount: number;
  lowStockCount: number;
  accountsReceivable: number;
  statusCounts?: Record<string, number>;
  overduePromisedOrders?: Array<{ id: string; folio: string; promisedDate: string }>;
  topProductsUsed?: Array<{ name: string; count: number }>;
  ordersByTechnician?: Record<string, number>;
  ordersBySucursal?: Record<string, number>;
}

