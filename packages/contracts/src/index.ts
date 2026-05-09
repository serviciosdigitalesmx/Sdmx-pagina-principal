export type ServiceStatus = 'pending' | 'diagnosing' | 'waiting_parts' | 'ready' | 'delivered' | 'cancelled';

export interface DeviceInfo {
  brand: string;
  model: string;
  serial?: string;
  type: 'phone' | 'laptop' | 'tablet' | 'other';
}

export interface ServiceOrder {
  id?: string;
  tenant_id: string;
  customer_id: string;
  device_info: DeviceInfo;
  problem_description: string;
  status: ServiceStatus;
  total_cost: number;
  created_at?: string;
}

// Common response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string } | string | null;
}

// Users / Session / Auth
export interface UserDto {
  id: string;
  auth_user_id?: string;
  tenant_id: string;
  branch_id?: string | null;
  full_name?: string;
  email?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface SubscriptionDto {
  id: string;
  tenant_id: string;
  plan_code?: PlanCode;
  plan?: PlanCode;
  status: string;
  current_period_end?: string | null;
  grace_until?: string | null;
  provider?: string;
  external_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SessionDto {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  user: UserDto;
  shop?: any;
  subscription?: SubscriptionDto | null;
  accessGranted?: boolean;
  roles?: string[];
  permissions?: string[];
}

export type PlanCode = 'free' | 'basic' | 'pro' | 'scale' | string;

// Customers
export interface CustomerDto {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface CustomerCreateRequestDto {
  full_name: string;
  email?: string | null;
  phone?: string | null;
  branch_id?: string | null;
  // camelCase aliases for backend
  fullName?: string;
  branchId?: string | null;
}

export interface CustomerContactDto {
  id: string;
  customer_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface CustomerContactCreateRequestDto {
  customer_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  // camelCase aliases
  customerId?: string;
}

// Suppliers
export interface SupplierDto {
  id: string;
  tenant_id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface CreateSupplierRequestDto {
  id?: string;
  tenant_id?: string;
  name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  // camelCase aliases
  contactName?: string;
}

export interface UpdateSupplierRequestDto extends Partial<CreateSupplierRequestDto> { }

// Inventory
export interface InventoryProductDto {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  sku: string;
  name: string;
  category?: string | null;
  unit_cost_mxn?: number | null;
  sale_price_mxn?: number | null;
  current_stock: number;
  min_stock: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryProductCreateRequestDto {
  sku: string;
  name: string;
  category?: string | null;
  unit_cost_mxn?: number | null;
  sale_price_mxn?: number | null;
  min_stock?: number;
  // camelCase aliases
  unitCostMxn?: number | null;
  salePriceMxn?: number | null;
  minStock?: number;
  branchId?: string;
  isActive?: boolean;
}

export interface InventoryProductUpdateRequestDto extends Partial<InventoryProductCreateRequestDto> { }

export interface InventoryMovementDto {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  product_id: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | string;
  quantity: number;
  unit_cost_mxn?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  created_at?: string;
}

export interface InventoryMovementCreateRequestDto {
  product_id: string;
  movement_type: InventoryMovementDto['movement_type'];
  quantity: number;
  unit_cost_mxn?: number;
  reference_type?: string;
  reference_id?: string;
  note?: string;
  // camelCase aliases
  productId?: string;
  movementType?: InventoryMovementDto['movement_type'];
  unitCostMxn?: number;
  referenceType?: string;
  referenceId?: string;
  branchId?: string;
}

export interface InventoryKardexEntryDto {
  // older shape fields
  product_id?: string;
  quantity?: number;
  unit_cost_mxn?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at?: string;
  // new shape used by backend mappings
  movement?: InventoryMovementDto;
  product?: InventoryProductDto;
  balance?: number;
}

// Purchases / Quotes
export interface PurchaseOrderDto {
  id: string;
  tenant_id: string;
  supplier_id: string;
  status: string;
  total_amount_cents: number;
  currency?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: PurchaseItemDto[];
}

export interface PurchaseItemDto {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost_cents: number;
  total_cost_cents: number;
}

export interface CreatePurchaseRequestDto {
  supplier_id: string;
  items: Array<{ product_id: string; quantity: number; unit_cost_cents: number; productId?: string; unitCostCents?: number }>;
  // camelCase aliases
  supplierId?: string;
  notes?: string;
}

export interface ConfirmPurchaseRequestDto { purchaseOrderId: string; tenantId?: string }

export interface QuoteDto {
  id: string;
  tenant_id: string;
  service_order_id: string;
  subtotal_mxn: number;
  vat_mxn: number;
  total_mxn: number;
  advance_mxn?: number;
  balance_mxn?: number;
  status: string;
  created_at?: string;
}

export interface QuoteCreateRequestDto {
  service_order_id: string;
  subtotal_mxn: number;
  vat_mxn: number;
  total_mxn: number;
  advance_mxn?: number;
  // camelCase aliases
  serviceOrderId?: string;
  subtotalMxn?: number;
  vatMxn?: number;
  totalMxn?: number;
  advanceMxn?: number;
}

// Expenses
export interface ExpenseCategoryDto {
  id: string;
  tenant_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface ExpenseDto {
  id: string;
  tenant_id: string;
  category_id: string;
  expense_date: string;
  description: string;
  amount_cents: number;
  payment_method?: string;
  reference?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface CreateExpenseRequestDto {
  category_id: string;
  expense_date: string;
  description: string;
  amount_cents: number;
  payment_method?: string;
  reference?: string;
  notes?: string;
  // camelCase aliases
  categoryId?: string;
  expenseDate?: string;
  amountCents?: number;
  paymentMethod?: string;
}

export interface CreateExpenseCategoryRequestDto { name: string; description?: string; }

// Service orders (extended)
export interface ServiceOrderDto {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  customer_id?: string | null;
  folio?: string;
  status: ServiceStatus;
  device_info?: DeviceInfo;
  device_type?: string | null;
  device_brand?: string | null;
  device_model?: string | null;
  reported_issue?: string | null;
  serial_number?: string | null;
  accessories?: string | null;
  internal_notes?: string | null;
  warranty_until?: string; // ISO timestamp
  evidence_metadata?: any[]; // JSON array metadata for evidence images
  promised_date?: string | null;
  costo_estimado?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceOrderCreateRequestDto {
  customer_id?: string;
  device_info?: DeviceInfo;
  problem_description?: string;
  promised_date?: string;
  // camelCase aliases used by backend
  customerId?: string;
  deviceInfo?: DeviceInfo;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  problemDescription?: string;
  promisedDate?: string;
  estimatedCost?: number;
  notes?: string;
  serialNumber?: string;
  accessories?: string;
  internalNotes?: string;
  warrantyUntil?: string; // ISO timestamp
  evidenceMetadata?: any[];
  receptionChecklist?: any;
  receptionPhotoBase64?: string;
  sourceQuoteFolio?: string;
  // additional backend aliases
  tenantId?: string;
  branchId?: string;
  reportedIssue?: string;
  status?: string;
}

export interface ServiceOrderStatusUpdateRequestDto { status: ServiceStatus; note?: string }

export interface TimelineEventDto {
  id: string;
  service_order_id: string;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  created_at?: string;
}

export interface EvidenceUploadRequest {
  serviceOrderId: string;
  fileName: string;
  fileData: string; // base64 encoded file
}

// Billing / Checkout
export interface CheckoutRequestDto {
  plan: PlanCode;
  success_url?: string;
  cancel_url?: string;
}

export interface CheckoutResponseDto {
  initPoint?: string; // e.g., MercadoPago init point or hosted checkout URL
  checkoutUrl?: string;
  preferenceId?: string;
}

// Finance / Reports
export interface FinanceTransactionDto {
  id: string;
  amount_cents: number;
  currency?: string;
  description?: string | null;
  created_at?: string;
  // optional fields used by services
  type?: string;
  date?: string;
  source?: string;
  reference_id?: string;
  referenceId?: string;
  category?: string;
}

export interface FinanceMonthlyDto { month?: string; total_mxn?: number; months?: Array<{ month: string; total_mxn?: number }>; range?: ReportDateRangeDto }

export interface FinanceSummaryDto {
  total_mxn?: number;
  totalIncomeCents?: number;
  expenses_mxn?: number;
  revenueSource?: string;
  range?: ReportDateRangeDto;
  totalExpensesCents?: number;
  totalPurchasesCents?: number;
  accountsReceivableCents?: number;
  balanceCents?: number;
  notes?: string[];
}

export interface ReportDateRangeDto { from?: string | null; to?: string | null }

// Dashboard
export interface DashboardSummaryDto {
  totalServiceOrders?: number;
  pending?: number;
  diagnosing?: number;
  ready?: number;
}

// Auth requests
export interface LoginRequestDto { email: string; password: string }
export interface RegisterRequestDto { email: string; password: string; full_name?: string; fullName?: string; tenantId?: string }

// Reports DTOs used by backend
export interface OperationsReportDto {
  range: ReportDateRangeDto;
  totalOrders: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  ordersCreated: Array<{ date: string; count: number }>;
}

export interface FinanceReportDto {
  range: ReportDateRangeDto;
  estimatedRevenueCents: number;
  totalExpensesCents: number;
  confirmedPurchasesCents: number;
  estimatedBalanceCents: number;
  revenueSource: string;
  notes: string[];
}

export interface InventoryReportDto {
  range: ReportDateRangeDto;
  lowStockProducts: any[];
  recentMovements: any[];
}

export interface PurchasesExpensesReportDto {
  range: ReportDateRangeDto;
  purchasesBySupplier: Array<{ supplier_id: string; supplier_name: any; count: number; total_amount_cents: number }>;
  expensesByCategory: Array<{ category_id: string; category_name: any; count: number; total_amount_cents: number }>;
}

