import { appService } from '../domain/app-service.js';
import { badRequest, bearer, forbidden, notFound, ok, parseJson, unauthorized } from '../core/http.js';
import type {
  ConfirmPurchaseRequestDto as ConfirmPurchaseRequest,
  CreatePurchaseRequestDto as CreatePurchaseRequest,
  CreateExpenseCategoryRequestDto as CreateExpenseCategoryRequest,
  CreateExpenseRequestDto as CreateExpenseRequest,
  CreateSupplierRequestDto as SupplierCreateRequest,
  CustomerContactCreateRequestDto as CustomerContactCreateRequest,
  CustomerCreateRequestDto as CustomerCreateRequest,
  EvidenceUploadRequest,
  InventoryMovementCreateRequestDto as InventoryMovementCreateRequest,
  InventoryProductCreateRequestDto as InventoryProductCreateRequest,
  InventoryProductUpdateRequestDto as InventoryProductUpdateRequest,
  LoginRequestDto as LoginRequest,
  QuoteCreateRequestDto as QuoteCreateRequest,
  RegisterRequestDto as RegisterRequest,
  ServiceOrderCreateRequestDto as ServiceOrderCreateRequest,
  ServiceOrderStatusUpdateRequestDto as ServiceOrderStatusUpdateRequest,
  UpdateSupplierRequestDto as SupplierUpdateRequest
} from '@sdmx/contracts';

import { logger } from '../core/logger.js';

const safe = async (fn: () => Promise<Response>): Promise<Response> => {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de dominio';
    logger.error({ error }, message);
    return badRequest('DOMAIN_ERROR', message);
  }
};

export const handleApi = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (pathname === '/api/health' && method === 'GET') return ok({ status: 'healthy', time: new Date().toISOString() });

  if (pathname === '/api/auth/register' && method === 'POST') {
    return safe(async () => {
      const body = await parseJson<RegisterRequest>(request);
      if (!body.email || !body.password || !body.tenantId || !body.fullName) return badRequest('VALIDATION_ERROR', 'email, password, tenantId y fullName son obligatorios');
      return ok(await appService.register(body));
    });
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    return safe(async () => {
      const body = await parseJson<LoginRequest>(request);
      if (!body.email || !body.password) return badRequest('VALIDATION_ERROR', 'email y password son obligatorios');
      return ok(await appService.login(body.email, body.password));
    });
  }
  if (pathname === '/api/billing/checkout' && method === 'POST') {
    try {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<{ plan?: 'basic' | 'pro' | 'enterprise' }>(request);
      if (!body.plan) return badRequest('VALIDATION_ERROR', 'plan es obligatorio');
      return ok(await appService.createCheckout(token, { plan: body.plan }));
    } catch (error) {
      return badRequest('DOMAIN_ERROR', error instanceof Error ? error.message : 'Error de dominio');
    }
  }

  if (pathname === '/api/subscription/status' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.subscriptionStatus(token));
    });
  }

  if (pathname === '/api/webhooks/mercadopago' && method === 'POST') {
    try {
      const body: unknown = await parseJson(request);
      const signature = request.headers.get('x-signature') || undefined;
      const requestId = request.headers.get('x-request-id') || undefined;
      return ok(await appService.handleMercadoPagoWebhook(body, signature, requestId));
    } catch (error) {
      return badRequest('DOMAIN_ERROR', error instanceof Error ? error.message : 'Error de dominio');
    }
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.sessionFromToken(token));
    });
  }

  if (pathname === '/api/dashboard/summary' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.dashboardSummary(token));
    });
  }

  if (pathname === '/api/service-orders' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listServiceOrders(token));
    });
  }

  if (pathname === '/api/service-orders' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<ServiceOrderCreateRequest>(request);
      return ok(await appService.createServiceOrder(token, body));
    });
  }

  const statusMatch = pathname.match(/^\/api\/service-orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<ServiceOrderStatusUpdateRequest>(request);
      return ok(await appService.updateServiceOrderStatus(token, statusMatch[1], body));
    });
  }

  const timelineMatch = pathname.match(/^\/api\/service-orders\/([^/]+)\/timeline$/);
  if (timelineMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listStatusTimeline(token, timelineMatch[1]));
    });
  }

  if (pathname === '/api/customers' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listCustomers(token));
    });
  }

  if (pathname === '/api/customers' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.createCustomer(token, await parseJson<CustomerCreateRequest>(request)));
    });
  }

  const contactsMatch = pathname.match(/^\/api\/customers\/([^/]+)\/contacts$/);
  if (contactsMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listCustomerContacts(token, contactsMatch[1]));
    });
  }

  if (contactsMatch && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<CustomerContactCreateRequest>(request);
      return ok(await appService.createCustomerContact(token, { ...body, customerId: contactsMatch[1] }));
    });
  }

  if (pathname === '/api/quotes' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listQuotes(token));
    });
  }

  if (pathname === '/api/quotes' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.createQuote(token, await parseJson<QuoteCreateRequest>(request)));
    });
  }

  const portalOrder = pathname.match(/^\/api\/portal\/orders\/([^/]+)$/);
  if (portalOrder && method === 'GET') {
    return safe(async () => {
      const data = await appService.getPortalOrderPublic(portalOrder[1]);
      if (!data[0]) return notFound('Folio no encontrado');
      return ok(data[0]);
    });
  }

  if (pathname === '/api/evidences/signed-upload' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<EvidenceUploadRequest>(request);
      if (!body.bucket || !body.path) return badRequest('VALIDATION_ERROR', 'bucket y path son obligatorios');
      return ok(await appService.signedUpload(token, body));
    });
  }

  if (pathname === '/api/admin/audit-events' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listAuditEvents(token));
    });
  }

  if (pathname === '/api/products' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listInventoryProducts(token));
    });
  }

  if (pathname === '/api/products' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<InventoryProductCreateRequest>(request);
      if (!body.tenantId || !body.sku || !body.name) return badRequest('VALIDATION_ERROR', 'tenantId, sku y name son obligatorios');
      return ok(await appService.createInventoryProduct(token, body));
    });
  }

  const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (productMatch && method === 'PATCH') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<InventoryProductUpdateRequest>(request);
      return ok(await appService.updateInventoryProduct(token, productMatch[1], body));
    });
  }

  const productMovements = pathname.match(/^\/api\/products\/([^/]+)\/movements$/);
  if (productMovements && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listInventoryMovements(token, productMovements[1]));
    });
  }

  const productKardex = pathname.match(/^\/api\/products\/([^/]+)\/kardex$/);
  if (productKardex && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.getInventoryKardex(token, productKardex[1]));
    });
  }

  if (pathname === '/api/inventory/movements' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<InventoryMovementCreateRequest>(request);
      if (!body.tenantId || !body.productId || !body.movementType || !body.quantity) {
        return badRequest('VALIDATION_ERROR', 'tenantId, productId, movementType y quantity son obligatorios');
      }
      return ok(await appService.createInventoryMovement(token, body));
    });
  }

  if (pathname === '/api/inventory/movements' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listInventoryMovements(token));
    });
  }

  if (pathname === '/api/suppliers' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listSuppliers(token));
    });
  }

  if (pathname === '/api/suppliers' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<SupplierCreateRequest>(request);
      if (!body.tenantId || !body.name) return badRequest('VALIDATION_ERROR', 'tenantId y name son obligatorios');
      return ok(await appService.createSupplier(token, body));
    });
  }

  if (pathname === '/api/purchases' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listPurchases(token));
    });
  }

  if (pathname === '/api/purchases' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<CreatePurchaseRequest>(request);
      if (!body.supplierId || !Array.isArray(body.items) || body.items.length === 0) {
        return badRequest('VALIDATION_ERROR', 'supplierId e items son obligatorios');
      }
      return ok(await appService.createPurchase(token, body));
    });
  }

  const purchaseMatch = pathname.match(/^\/api\/purchases\/([^/]+)$/);
  if (purchaseMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.getPurchaseById(token, purchaseMatch[1]));
    });
  }

  const confirmPurchaseMatch = pathname.match(/^\/api\/purchases\/([^/]+)\/confirm$/);
  if (confirmPurchaseMatch && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<ConfirmPurchaseRequest>(request).catch(() => null);
      return ok(await appService.confirmPurchase(token, confirmPurchaseMatch[1], body ?? undefined));
    });
  }

  const cancelPurchaseMatch = pathname.match(/^\/api\/purchases\/([^/]+)\/cancel$/);
  if (cancelPurchaseMatch && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.cancelPurchase(token, cancelPurchaseMatch[1]));
    });
  }

  const supplierMatch = pathname.match(/^\/api\/suppliers\/([^/]+)$/);
  if (supplierMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.getSupplierById(token, supplierMatch[1]));
    });
  }

  if (supplierMatch && method === 'PATCH') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<SupplierUpdateRequest>(request);
      return ok(await appService.updateSupplier(token, supplierMatch[1], body));
    });
  }

  if (supplierMatch && method === 'DELETE') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.deleteSupplier(token, supplierMatch[1]));
    });
  }

  if (pathname === '/api/expense-categories' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listExpenseCategories(token));
    });
  }

  if (pathname === '/api/expense-categories' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<CreateExpenseCategoryRequest>(request);
      if (!body.tenantId || !body.name) return badRequest('VALIDATION_ERROR', 'tenantId y name son obligatorios');
      return ok(await appService.createExpenseCategory(token, body));
    });
  }

  if (pathname === '/api/expenses' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.listExpenses(token));
    });
  }

  if (pathname === '/api/expenses' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      const body = await parseJson<CreateExpenseRequest>(request);
      if (!body.tenantId || !body.categoryId || !body.description || body.amountCents === undefined) {
        return badRequest('VALIDATION_ERROR', 'tenantId, categoryId, description y amountCents son obligatorios');
      }
      return ok(await appService.createExpense(token, body));
    });
  }

  const expenseMatch = pathname.match(/^\/api\/expenses\/([^/]+)$/);
  if (expenseMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.getExpenseById(token, expenseMatch[1]));
    });
  }

  if (expenseMatch && method === 'DELETE') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      await appService.ensureActiveSubscription(token);
      return ok(await appService.deleteExpense(token, expenseMatch[1]));
    });
  }

  if (pathname === '/api/admin/forbidden') return forbidden('Sin permisos');
  return notFound();
};
