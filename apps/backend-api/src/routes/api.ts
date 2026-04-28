import { appService } from '../domain/app-service.js';
import { badRequest, bearer, forbidden, notFound, ok, parseJson, unauthorized } from '../core/http.js';
import type { CustomerContactCreateRequest, CustomerCreateRequest, EvidenceUploadRequest, LoginRequest, QuoteCreateRequest, RegisterRequest, ServiceOrderCreateRequest, ServiceOrderStatusUpdateRequest } from '../types/contracts.js';

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
      const body = await parseJson<Record<string, unknown>>(request);
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

  if (pathname === '/api/admin/forbidden') return forbidden('Sin permisos');
  return notFound();
};
