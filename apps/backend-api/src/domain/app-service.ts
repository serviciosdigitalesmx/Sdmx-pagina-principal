import { authService } from '../services/auth.service.js';
import { billingService } from '../services/billing.service.js';
import { customersService } from '../services/customers.service.js';
import { quotesService } from '../services/quotes.service.js';
import { serviceOrdersService } from '../services/service-orders.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { supabase } from '../services/supabase.js';
import type {
  CheckoutRequestDto,
  CheckoutResponseDto,
  CustomerContactCreateRequestDto,
  CustomerContactDto,
  CustomerCreateRequestDto,
  CustomerDto,
  DashboardSummaryDto,
  EvidenceUploadRequest,
  LoginRequestDto,
  QuoteCreateRequestDto,
  QuoteDto,
  RegisterRequestDto,
  ServiceOrderCreateRequestDto,
  ServiceOrderDto,
  ServiceOrderStatusUpdateRequestDto,
  SessionDto,
  SubscriptionDto,
  UserDto,
  TimelineEventDto
} from '@sdmx/contracts';

export const appService = {
  register: (payload: RegisterRequestDto): Promise<UserDto> => authService.register(payload),
  login: (email: string, password: string): Promise<SessionDto> => authService.login(email, password),
  sessionFromToken: (token: string): Promise<SessionDto> => authService.sessionFromToken(token),
  subscriptionStatus: (token: string): Promise<{ subscription: SubscriptionDto | null }> => subscriptionService.subscriptionStatus(token),
  ensureActiveSubscription: (token: string): Promise<void> => subscriptionService.ensureActiveSubscription(token),
  createCheckout: (token: string, request: CheckoutRequestDto): Promise<CheckoutResponseDto> => billingService.createCheckout(token, request),
  handleMercadoPagoWebhook: (payload: unknown, signature?: string, requestId?: string): Promise<{ received: true }> =>
    billingService.handleMercadoPagoWebhook(payload, signature, requestId),
  dashboardSummary: (token: string): Promise<DashboardSummaryDto> => serviceOrdersService.dashboardSummary(token),
  createServiceOrder: (token: string, request: ServiceOrderCreateRequestDto): Promise<ServiceOrderDto> =>
    serviceOrdersService.createServiceOrder(token, request),
  listServiceOrders: (token: string): Promise<ServiceOrderDto[]> => serviceOrdersService.listServiceOrders(token),
  updateServiceOrderStatus: (token: string, serviceOrderId: string, req: ServiceOrderStatusUpdateRequestDto): Promise<ServiceOrderDto> =>
    serviceOrdersService.updateServiceOrderStatus(token, serviceOrderId, req),
  listStatusTimeline: (token: string, serviceOrderId: string): Promise<TimelineEventDto[]> =>
    serviceOrdersService.listStatusTimeline(token, serviceOrderId),
  getPortalOrderPublic: (folio: string) => serviceOrdersService.getPortalOrderPublic(folio),
  signedUpload: (token: string, request: EvidenceUploadRequest) => serviceOrdersService.signedUpload(token, request),
  listCustomers: (token: string): Promise<CustomerDto[]> => customersService.listCustomers(token),
  createCustomer: (token: string, request: CustomerCreateRequestDto): Promise<CustomerDto> => customersService.createCustomer(token, request),
  listCustomerContacts: (token: string, customerId: string): Promise<CustomerContactDto[]> => customersService.listCustomerContacts(token, customerId),
  createCustomerContact: (token: string, request: CustomerContactCreateRequestDto): Promise<CustomerContactDto> =>
    customersService.createCustomerContact(token, request),
  listQuotes: (token: string): Promise<QuoteDto[]> => quotesService.listQuotes(token),
  createQuote: (token: string, request: QuoteCreateRequestDto): Promise<QuoteDto> => quotesService.createQuote(token, request),
  listAuditEvents: async (token: string): Promise<Array<{ id: string }>> => {
    const session = await authService.sessionFromToken(token);
    const tenantId = String(session.shop.id);
    return supabase.query<Array<{ id: string }>>(`audit_events?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&select=*`, token);
  }
};
