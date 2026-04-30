export type ApiErrorDto = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorDto;
};

export type PlanCode = "basic" | "pro" | "enterprise";
export type SubscriptionStatusDto = "pending" | "trialing" | "active" | "past_due" | "suspended" | "canceled";

export type TenantDto = {
  id: string;
  name: string;
  slug?: string | null;
  billing_exempt?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserDto = {
  id: string;
  auth_user_id: string;
  tenant_id: string;
  full_name: string;
  email: string;
  branch_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ShopDto = TenantDto;

export type RoleDto = {
  id: string;
  name: string;
  description?: string | null;
};

export type PermissionDto = {
  id: string;
  name: string;
  description?: string | null;
};

export type SubscriptionDto = {
  id?: string;
  tenant_id: string;
  plan: PlanCode;
  status: SubscriptionStatusDto;
  provider: "mercadopago" | "trial";
  external_id: string;
  current_period_end?: string | null;
  raw_payload?: unknown;
  created_at?: string;
  updated_at?: string;
};

export type SessionDto = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserDto;
  shop: ShopDto;
  subscription: SubscriptionDto | null;
  roles: RoleDto[];
  permissions: PermissionDto[];
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type RegisterRequestDto = {
  email: string;
  password: string;
  fullName: string;
  tenantId: string;
  branchId?: string | null;
};

export type CheckoutRequestDto = {
  plan: PlanCode;
};

export type CheckoutResponseDto = {
  initPoint: string;
  preferenceId?: string;
};

export type DashboardSummaryDto = {
  openOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  totalCustomers: number;
  totalSalesMxn: number;
};

export type ServiceOrderCreateRequestDto = {
  tenantId: string;
  branchId?: string | null;
  customerId: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  reportedIssue: string;
  estimatedCost?: number | null;
  notes?: string | null;
  receptionChecklist?: Record<string, boolean> | null;
  receptionPhotoBase64?: string | null;
  sourceQuoteFolio?: string | null;
  promisedDate?: string | null;
};

export type ServiceOrderStatusUpdateRequestDto = {
  status: string;
  note?: string | null;
};

export type ServiceOrderDto = {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  folio: string;
  customer_id: string;
  status: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  reported_issue: string;
  estimated_cost?: number | null;
  notes?: string | null;
  reception_checklist?: Record<string, boolean> | null;
  reception_photo_base64?: string | null;
  source_quote_folio?: string | null;
  promised_date?: string | null;
  created_at: string;
  updated_at: string;
};

export type TimelineEventDto = {
  id: string;
  service_order_id: string;
  from_status: string;
  to_status: string;
  note?: string | null;
  created_at: string;
};

export type CustomerDto = {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  created_at: string;
  updated_at?: string;
};

export type CustomerCreateRequestDto = {
  tenantId: string;
  branchId?: string | null;
  fullName: string;
  email: string;
  phone?: string | null;
};

export type CustomerContactDto = {
  id: string;
  customer_id: string;
  name: string;
  role: string;
  email: string;
  phone?: string | null;
  created_at: string;
};

export type CustomerContactCreateRequestDto = {
  customerId: string;
  name: string;
  role: string;
  email: string;
  phone?: string | null;
};

export type QuoteCreateRequestDto = {
  tenantId: string;
  serviceOrderId: string;
  subtotalMxn: number;
  vatMxn: number;
  advanceMxn: number;
};

export type QuoteDto = {
  id: string;
  tenant_id: string;
  service_order_id: string;
  subtotal_mxn: number;
  vat_mxn: number;
  total_mxn: number;
  advance_mxn: number;
  balance_mxn: number;
  status: string;
  created_at: string;
};

export type EvidenceUploadRequest = {
  bucket: string;
  path: string;
  expiresInSeconds?: number;
};

export type InventoryProductDto = {
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
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryProductCreateRequestDto = {
  tenantId: string;
  branchId?: string | null;
  sku: string;
  name: string;
  category?: string | null;
  unitCostMxn?: number | null;
  salePriceMxn?: number | null;
  minStock?: number | null;
};

export type InventoryProductUpdateRequestDto = {
  sku?: string;
  name?: string;
  category?: string | null;
  unitCostMxn?: number | null;
  salePriceMxn?: number | null;
  minStock?: number | null;
  isActive?: boolean;
};

export type InventoryMovementTypeDto = "in" | "out" | "adjustment" | "transfer";

export type InventoryMovementDto = {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  product_id: string;
  movement_type: InventoryMovementTypeDto;
  quantity: number;
  unit_cost_mxn?: number | null;
  reference_type?: string | null;
  reference_id?: string | null;
  note?: string | null;
  created_at: string;
};

export type InventoryMovementCreateRequestDto = {
  tenantId: string;
  branchId?: string | null;
  productId: string;
  movementType: InventoryMovementTypeDto;
  quantity: number;
  unitCostMxn?: number | null;
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
};

export type InventoryKardexEntryDto = {
  movement: InventoryMovementDto;
  product: InventoryProductDto;
  balance: number;
};

export type SupplierDto = {
  id: string;
  tenant_id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateSupplierRequestDto = {
  tenantId: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type UpdateSupplierRequestDto = {
  name?: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type PurchaseOrderStatusDto = 'draft' | 'confirmed' | 'cancelled';

export type PurchaseItemDto = {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  product_id: string;
  quantity: number;
  unit_cost_cents: number;
  total_cost_cents: number;
  created_at: string;
};

export type PurchaseOrderDto = {
  id: string;
  tenant_id: string;
  supplier_id: string;
  status: PurchaseOrderStatusDto;
  total_amount_cents: number;
  currency: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseItemDto[];
};

export type CreatePurchaseRequestDto = {
  supplierId: string;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitCostCents: number;
  }>;
};

export type ConfirmPurchaseRequestDto = {
  tenantId: string;
};
