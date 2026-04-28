export type ApiError = { code: string; message: string };
export type ApiResponse<T> = { success: boolean; data?: T; error?: ApiError };

export type UserSessionDto = Record<string, unknown>;
export type ShopSessionDto = Record<string, unknown>;
export type SubscriptionSessionDto = Record<string, unknown> | null;

export type SessionDto = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserSessionDto;
  shop: ShopSessionDto;
  subscription: SubscriptionSessionDto;
  roles: Record<string, unknown>[];
  permissions: Record<string, unknown>[];
};

export type LoginRequestDto = { email: string; password: string };

export type ServiceOrderCreateRequestDto = {
  tenantId?: string;
  branchId?: string | null;
  customerId: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  reportedIssue: string;
  promisedDate?: string | null;
};

export type PlanCode = 'basic' | 'pro' | 'enterprise';

export type CheckoutRequestDto = {
  plan: PlanCode;
};

export type CheckoutResponseDto = {
  initPoint: string;
  preferenceId?: string;
};

export type SubscriptionStatusDto = 'pending' | 'active' | 'past_due' | 'canceled';

export type SubscriptionDto = {
  id?: string;
  tenantId?: string;
  plan: PlanCode;
  status: SubscriptionStatusDto;
  provider: 'mercadopago';
  externalId: string;
  currentPeriodEnd?: string | null;
};
