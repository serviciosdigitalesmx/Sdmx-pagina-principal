export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { success: boolean; data?: T; error?: ApiError };

export type LoginRequest = { email: string; password: string };
export type ForgotPasswordRequest = { email: string };
export type SessionData = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: Record<string, unknown>;
  shop: Record<string, unknown>;
  subscription: Record<string, unknown> | null;
  roles: Record<string, unknown>[];
  permissions: Record<string, unknown>[];
};

export type RegisterRequest = { email: string; password: string; fullName: string; tenantId: string; branchId?: string | null };
export type ServiceOrderCreateRequest = {
  tenantId: string;
  branchId?: string | null;
  customerId: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  reportedIssue: string;
  promisedDate?: string | null;
};
export type ServiceOrderStatusUpdateRequest = { status: string; note?: string | null };
export type CustomerCreateRequest = { tenantId: string; branchId?: string | null; fullName: string; email: string; phone?: string | null };
export type CustomerContactCreateRequest = { customerId: string; name: string; role: string; email: string; phone?: string | null };
export type QuoteCreateRequest = { tenantId: string; serviceOrderId: string; subtotalMxn: number; vatMxn: number; advanceMxn: number };
export type EvidenceUploadRequest = { bucket: string; path: string; expiresInSeconds?: number };
