import { appService } from '../domain/app-service.js';
import { badRequest, bearer, forbidden, notFound, ok, parseJson, unauthorized } from '../core/http.js';
import { logger } from '../core/logger.js';
import { ValidationError, validators } from '../core/validator.js';
import type { CustomerContactCreateRequest, CustomerCreateRequest, EvidenceUploadRequest, ForgotPasswordRequest, QuoteCreateRequest, RegisterRequest, ServiceOrderCreateRequest, ServiceOrderStatusUpdateRequest } from '../types/contracts.js';

const safe = async (fn: () => Promise<Response>, request: Request): Promise<Response> => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ValidationError) {
      return badRequest('VALIDATION_ERROR', error.message);
    }

    logger.error({ err: error instanceof Error ? error.message : 'unknown', method: request.method, url: request.url }, 'request_failed');
    return badRequest('DOMAIN_ERROR', error instanceof Error ? error.message : 'Error de dominio');
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
      if (!body.email || !body.password || !body.tenantId || !body.fullName || body.password.length < 8) {
        throw new ValidationError('email, password(>=8), tenantId y fullName son obligatorios');
      }
      return ok(await appService.register(body));
    }, request);
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    return safe(async () => {
      const body = validators.login(await parseJson(request));
      return ok(await appService.login(body.email, body.password));
    }, request);
  }

  if (pathname === '/api/auth/forgot-password' && method === 'POST') {
    return safe(async () => {
      const body = validators.forgot(await parseJson<ForgotPasswordRequest>(request));
      return ok(await appService.forgotPassword(body.email));
    }, request);
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.sessionFromToken(token));
    }, request);
  }

  if (pathname === '/api/dashboard/summary' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.dashboardSummary(token));
    }, request);
  }

  if (pathname === '/api/service-orders' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.listServiceOrders(token));
    }, request);
  }

  if (pathname === '/api/service-orders' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<ServiceOrderCreateRequest>(request);
      if (!body.tenantId || !body.customerId || !body.deviceType || !body.deviceBrand || !body.deviceModel || !body.reportedIssue) {
        throw new ValidationError('Campos requeridos incompletos para service order');
      }
      return ok(await appService.createServiceOrder(token, body));
    }, request);
  }

  const statusMatch = pathname.match(/^\/api\/service-orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<ServiceOrderStatusUpdateRequest>(request);
      if (!body.status) throw new ValidationError('status es requerido');
      return ok(await appService.updateServiceOrderStatus(token, statusMatch[1], body));
    }, request);
  }

  const timelineMatch = pathname.match(/^\/api\/service-orders\/([^/]+)\/timeline$/);
  if (timelineMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.listStatusTimeline(token, timelineMatch[1]));
    }, request);
  }

  if (pathname === '/api/customers' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.listCustomers(token));
    }, request);
  }

  if (pathname === '/api/customers' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<CustomerCreateRequest>(request);
      if (!body.tenantId || !body.fullName || !body.email) throw new ValidationError('tenantId, fullName y email son requeridos');
      return ok(await appService.createCustomer(token, body));
    }, request);
  }

  const contactsMatch = pathname.match(/^\/api\/customers\/([^/]+)\/contacts$/);
  if (contactsMatch && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.listCustomerContacts(token, contactsMatch[1]));
    }, request);
  }

  if (contactsMatch && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<CustomerContactCreateRequest>(request);
      if (!body.name || !body.email) throw new ValidationError('name y email son requeridos');
      return ok(await appService.createCustomerContact(token, { ...body, customerId: contactsMatch[1] }));
    }, request);
  }

  if (pathname === '/api/quotes' && method === 'GET') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      return ok(await appService.listQuotes(token));
    }, request);
  }

  if (pathname === '/api/quotes' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<QuoteCreateRequest>(request);
      if (!body.tenantId || !body.serviceOrderId) throw new ValidationError('tenantId y serviceOrderId son requeridos');
      return ok(await appService.createQuote(token, body));
    }, request);
  }

  const portalOrder = pathname.match(/^\/api\/portal\/orders\/([^/]+)$/);
  if (portalOrder && method === 'GET') {
    return safe(async () => {
      const data = await appService.getPortalOrderPublic(portalOrder[1]);
      if (!data[0]) return notFound('Folio no encontrado');
      return ok(data[0]);
    }, request);
  }

  if (pathname === '/api/evidences/signed-upload' && method === 'POST') {
    return safe(async () => {
      const token = bearer(request);
      if (!token) return unauthorized();
      const body = await parseJson<EvidenceUploadRequest>(request);
      if (!body.bucket || !body.path) throw new ValidationError('bucket y path son obligatorios');
      return ok(await appService.signedUpload(token, body));
    }, request);
  }

  if (pathname === '/api/admin/forbidden') return forbidden('Sin permisos');
  return notFound();
};
