import { authService } from '../services/auth.service.js';
import { billingService } from '../services/billing.service.js';
import { expensesService } from '../services/expenses.service.js';
import { financeService } from '../services/finance.service.js';
import { inventoryService } from '../services/inventory.service.js';
import { customersService } from '../services/customers.service.js';
import { quotesService } from '../services/quotes.service.js';
import { purchasesService } from '../services/purchases.service.js';
import { reportsService } from '../services/reports.service.js';
import { serviceOrdersService } from '../services/service-orders.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { suppliersService } from '../services/suppliers.service.js';
import { supabase } from '../services/supabase.js';
import type {
  CreateSupplierRequestDto,
  CheckoutRequestDto,
  CheckoutResponseDto,
  CustomerContactCreateRequestDto,
  CustomerContactDto,
  CustomerCreateRequestDto,
  CustomerDto,
  DashboardSummaryDto,
  EvidenceUploadRequest,
  InventoryKardexEntryDto,
  InventoryMovementCreateRequestDto,
  InventoryMovementDto,
  InventoryProductCreateRequestDto,
  InventoryProductDto,
  InventoryProductUpdateRequestDto,
  LoginRequestDto,
  QuoteCreateRequestDto,
  QuoteDto,
  ConfirmPurchaseRequestDto,
  CreatePurchaseRequestDto,
  CreateExpenseCategoryRequestDto,
  CreateExpenseRequestDto,
  ExpenseCategoryDto,
  ExpenseDto,
  FinanceMonthlyDto,
  FinanceSummaryDto,
  FinanceTransactionDto,
  FinanceReportDto,
  InventoryReportDto,
  OperationsReportDto,
  PurchaseItemDto,
  PurchaseOrderDto,
  PurchasesExpensesReportDto,
  RegisterRequestDto,
  ServiceOrderCreateRequestDto,
  ServiceOrderDto,
  ServiceOrderStatusUpdateRequestDto,
  SessionDto,
  SubscriptionDto,
  SupplierDto,
  UpdateSupplierRequestDto,
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
  listPurchases: (token: string): Promise<PurchaseOrderDto[]> => purchasesService.listPurchases(token),
  getPurchaseById: (token: string, purchaseOrderId: string): Promise<PurchaseOrderDto> =>
    purchasesService.getPurchaseById(token, purchaseOrderId),
  createPurchase: (token: string, request: CreatePurchaseRequestDto): Promise<PurchaseOrderDto> =>
    purchasesService.createPurchase(token, request),
  confirmPurchase: (token: string, purchaseOrderId: string, request?: ConfirmPurchaseRequestDto): Promise<PurchaseOrderDto> =>
    purchasesService.confirmPurchase(token, purchaseOrderId, request),
  cancelPurchase: (token: string, purchaseOrderId: string): Promise<PurchaseOrderDto> =>
    purchasesService.cancelPurchase(token, purchaseOrderId),
  listExpenseCategories: (token: string): Promise<ExpenseCategoryDto[]> => expensesService.listCategories(token),
  createExpenseCategory: (token: string, request: CreateExpenseCategoryRequestDto): Promise<ExpenseCategoryDto> =>
    expensesService.createCategory(token, request),
  listExpenses: (token: string): Promise<ExpenseDto[]> => expensesService.listExpenses(token),
  getExpenseById: (token: string, expenseId: string): Promise<ExpenseDto> => expensesService.getExpenseById(token, expenseId),
  createExpense: (token: string, request: CreateExpenseRequestDto): Promise<ExpenseDto> => expensesService.createExpense(token, request),
  deleteExpense: (token: string, expenseId: string): Promise<{ deleted: true }> => expensesService.deleteExpense(token, expenseId),
  financeSummary: (token: string, from?: string | null, to?: string | null): Promise<FinanceSummaryDto> =>
    financeService.summary(token, { from, to }),
  financeMonthly: (token: string, from?: string | null, to?: string | null): Promise<FinanceMonthlyDto> =>
    financeService.monthly(token, { from, to }),
  financeTransactions: (token: string, from?: string | null, to?: string | null): Promise<FinanceTransactionDto[]> =>
    financeService.transactions(token, { from, to }),
  operationsReport: (token: string, from?: string | null, to?: string | null): Promise<OperationsReportDto> =>
    reportsService.operations(token, { from, to }),
  financeReport: (token: string, from?: string | null, to?: string | null): Promise<FinanceReportDto> =>
    reportsService.finance(token, { from, to }),
  inventoryReport: (token: string, from?: string | null, to?: string | null): Promise<InventoryReportDto> =>
    reportsService.inventory(token, { from, to }),
  purchasesExpensesReport: (token: string, from?: string | null, to?: string | null): Promise<PurchasesExpensesReportDto> =>
    reportsService.purchasesExpenses(token, { from, to }),
  listAuditEvents: async (token: string): Promise<Array<{ id: string }>> => {
    const session = await authService.sessionFromToken(token);
    const tenantId = String(session.shop.id);
    return supabase.query<Array<{ id: string }>>(`audit_events?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&select=*`, token);
  },
  listInventoryProducts: (token: string): Promise<InventoryProductDto[]> => inventoryService.listProducts(token),
  createInventoryProduct: (token: string, request: InventoryProductCreateRequestDto): Promise<InventoryProductDto> =>
    inventoryService.createProduct(token, request),
  updateInventoryProduct: (token: string, productId: string, request: InventoryProductUpdateRequestDto): Promise<InventoryProductDto> =>
    inventoryService.updateProduct(token, productId, request),
  listInventoryMovements: (token: string, productId?: string): Promise<InventoryMovementDto[]> =>
    inventoryService.listMovements(token, productId),
  createInventoryMovement: (token: string, request: InventoryMovementCreateRequestDto): Promise<InventoryMovementDto> =>
    inventoryService.createMovement(token, request),
  getInventoryKardex: (token: string, productId: string): Promise<InventoryKardexEntryDto[]> =>
    inventoryService.getKardex(token, productId),
  listSuppliers: (token: string): Promise<SupplierDto[]> => suppliersService.listSuppliers(token),
  getSupplierById: (token: string, supplierId: string): Promise<SupplierDto> =>
    suppliersService.getSupplierById(token, supplierId),
  createSupplier: (token: string, request: CreateSupplierRequestDto): Promise<SupplierDto> =>
    suppliersService.createSupplier(token, request),
  updateSupplier: (token: string, supplierId: string, request: UpdateSupplierRequestDto): Promise<SupplierDto> =>
    suppliersService.updateSupplier(token, supplierId, request),
  deleteSupplier: (token: string, supplierId: string): Promise<{ deleted: true }> =>
    suppliersService.deleteSupplier(token, supplierId)
};
