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
export type SubscriptionStatusDto = "pending" | "active" | "past_due" | "canceled";

export type TenantDto = {
  id: string;
  name: string;
  slug?: string | null;
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
  provider: "mercadopago";
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
