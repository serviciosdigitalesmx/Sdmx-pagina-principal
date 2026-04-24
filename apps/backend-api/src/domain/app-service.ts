import { supabase } from '../services/supabase.js';
import type { CustomerContactCreateRequest, CustomerCreateRequest, EvidenceUploadRequest, QuoteCreateRequest, RegisterRequest, ServiceOrderCreateRequest, ServiceOrderStatusUpdateRequest, SessionData } from '../types/contracts.js';

const IVA_RATE = 0.16;
const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

export const appService = {
  async register(payload: RegisterRequest): Promise<Record<string, unknown>> {
    const auth = await supabase.authAdminCreate(payload.email, payload.password);
    const profile = await supabase.insertAsService<Record<string, unknown>[]>('users', {
      auth_user_id: auth.id,
      tenant_id: payload.tenantId,
      branch_id: payload.branchId ?? null,
      full_name: payload.fullName,
      email: payload.email,
      is_active: true
    });
    return profile[0] ?? {};
  },

  async login(email: string, password: string): Promise<SessionData> {
    const auth = await supabase.authLogin(email, password);
    const base = await this.sessionFromToken(auth.access_token);
    return {
      ...base,
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      expiresAt: new Date(Date.now() + ((auth.expires_in ?? 3600) * 1000)).toISOString()
    };
  },

  async sessionFromToken(accessToken: string): Promise<SessionData> {
    const authUser = await supabase.authUser(accessToken);
    const users = await supabase.query<Record<string, unknown>[]>(`users?auth_user_id=eq.${encodeURIComponent(authUser.id)}&select=*`, accessToken);
    const user = users[0];
    assert(Boolean(user), 'Usuario no encontrado en tenant');

    const tenantId = String(user.tenant_id);
    const [shops, subscriptions, userRoles] = await Promise.all([
      supabase.query<Record<string, unknown>[]>(`shops?id=eq.${encodeURIComponent(tenantId)}&select=*`, accessToken),
      supabase.query<Record<string, unknown>[]>(`subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=1&select=*`, accessToken),
      supabase.query<Record<string, unknown>[]>(`user_roles?user_id=eq.${encodeURIComponent(String(user.id))}&select=role_id,roles(*)`, accessToken)
    ]);

    const roleIds = userRoles.map((r) => r.role_id).filter(Boolean).map((id) => `'${String(id)}'`).join(',');
    const rolePermissions = roleIds
      ? await supabase.query<Record<string, unknown>[]>(`role_permissions?role_id=in.(${roleIds})&select=permission_id,permissions(*)`, accessToken)
      : [];

    const permissionSet = rolePermissions.map((rp) => rp.permissions).filter(Boolean) as Record<string, unknown>[];

    return {
      accessToken,
      refreshToken: '',
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      user,
      shop: shops[0] ?? { id: tenantId },
      subscription: subscriptions[0] ?? null,
      roles: userRoles,
      permissions: permissionSet
    };
  },

  async dashboardSummary(token: string): Promise<Record<string, number>> {
    const [orders, customers, quotes] = await Promise.all([
      supabase.query<Record<string, unknown>[]>(`service_orders?select=id,status`, token),
      supabase.query<Record<string, unknown>[]>(`customers?select=id`, token),
      supabase.query<Record<string, unknown>[]>(`quotations?select=id,status,total_mxn`, token)
    ]);

    const totalSales = quotes.filter((q) => String(q.status).toLowerCase() === 'approved').reduce((acc, q) => acc + Number(q.total_mxn ?? 0), 0);

    return {
      openOrders: orders.filter((o) => String(o.status).toLowerCase() === 'recibido').length,
      inProgressOrders: orders.filter((o) => ['diagnostico', 'reparacion'].includes(String(o.status).toLowerCase())).length,
      readyOrders: orders.filter((o) => String(o.status).toLowerCase() === 'listo').length,
      totalCustomers: customers.length,
      totalSalesMxn: Number(totalSales.toFixed(2))
    };
  },

  async createServiceOrder(token: string, request: ServiceOrderCreateRequest): Promise<Record<string, unknown>> {
    const next = await supabase.rpc<{ folio: string }>('next_tenant_folio', token, { p_tenant_id: request.tenantId, p_domain: 'service_order' });
    const created = await supabase.insert<Record<string, unknown>[]>('service_orders', token, {
      tenant_id: request.tenantId,
      branch_id: request.branchId ?? null,
      folio: next.folio,
      customer_id: request.customerId,
      status: 'recibido',
      device_type: request.deviceType,
      device_brand: request.deviceBrand,
      device_model: request.deviceModel,
      reported_issue: request.reportedIssue,
      promised_date: request.promisedDate ?? null,
      created_at: nowIso(),
      updated_at: nowIso()
    });
    await this.audit(token, request.tenantId, 'service_order.created', created[0] ?? {});
    return created[0] ?? {};
  },

  listServiceOrders(token: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`service_orders?order=updated_at.desc&select=*`, token);
  },

  async updateServiceOrderStatus(token: string, serviceOrderId: string, req: ServiceOrderStatusUpdateRequest): Promise<Record<string, unknown>> {
    const current = await supabase.query<Record<string, unknown>[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&select=id,tenant_id,status`, token);
    const order = current[0];
    assert(Boolean(order), 'Orden no encontrada');

    const policy = await supabase.query<Record<string, unknown>[]>(`status_transition_policy?entity=eq.service_order&from_status=eq.${encodeURIComponent(String(order.status))}&to_status=eq.${encodeURIComponent(req.status)}&select=id`, token);
    assert(policy.length > 0, 'Transición de estado no permitida por política');

    const updated = await supabase.patch<Record<string, unknown>[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&select=*`, token, { status: req.status, updated_at: nowIso() });

    await supabase.insert('service_order_timeline', token, {
      service_order_id: serviceOrderId,
      from_status: order.status,
      to_status: req.status,
      note: req.note ?? null,
      created_at: nowIso()
    });

    await this.audit(token, String(order.tenant_id), 'service_order.status_changed', { serviceOrderId, from: order.status, to: req.status });
    return updated[0] ?? {};
  },

  listStatusTimeline(token: string, serviceOrderId: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`service_order_timeline?service_order_id=eq.${encodeURIComponent(serviceOrderId)}&order=created_at.asc&select=*`, token);
  },

  listCustomers(token: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`customers?order=created_at.desc&select=*`, token);
  },

  async createCustomer(token: string, request: CustomerCreateRequest): Promise<Record<string, unknown>> {
    const created = await supabase.insert<Record<string, unknown>[]>('customers', token, {
      tenant_id: request.tenantId,
      branch_id: request.branchId ?? null,
      full_name: request.fullName,
      email: request.email,
      phone: request.phone ?? null,
      created_at: nowIso()
    });
    await this.audit(token, request.tenantId, 'customer.created', created[0] ?? {});
    return created[0] ?? {};
  },

  listCustomerContacts(token: string, customerId: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`customer_contacts?customer_id=eq.${encodeURIComponent(customerId)}&select=*`, token);
  },

  async createCustomerContact(token: string, request: CustomerContactCreateRequest): Promise<Record<string, unknown>> {
    const created = await supabase.insert<Record<string, unknown>[]>('customer_contacts', token, request);
    return created[0] ?? {};
  },

  listQuotes(token: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`quotations?order=created_at.desc&select=*`, token);
  },

  async createQuote(token: string, request: QuoteCreateRequest): Promise<Record<string, unknown>> {
    const subtotal = Number(request.subtotalMxn);
    const vat = request.vatMxn > 0 ? Number(request.vatMxn) : Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + vat).toFixed(2));
    const advance = Number(request.advanceMxn ?? 0);
    const balance = Number((total - advance).toFixed(2));

    const created = await supabase.insert<Record<string, unknown>[]>('quotations', token, {
      tenant_id: request.tenantId,
      service_order_id: request.serviceOrderId,
      subtotal_mxn: subtotal,
      vat_mxn: vat,
      total_mxn: total,
      advance_mxn: advance,
      balance_mxn: balance,
      status: 'draft',
      created_at: nowIso()
    });
    await this.audit(token, request.tenantId, 'quote.created', created[0] ?? {});
    return created[0] ?? {};
  },

  getPortalOrderPublic(folio: string): Promise<Record<string, unknown>[]> {
    return supabase.queryAsService<Record<string, unknown>[]>(`service_orders?folio=eq.${encodeURIComponent(folio.toUpperCase())}&select=id,folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,file_assets(id,path,is_public,mime_type)`);
  },

  signedUpload(token: string, request: EvidenceUploadRequest): Promise<Record<string, unknown>> {
    return supabase.storageSignedUpload(request.bucket, request.path, token, request.expiresInSeconds ?? 600);
  },

  async audit(token: string, tenantId: string, action: string, payload: unknown): Promise<void> {
    const session = await this.sessionFromToken(token);
    await supabase.insert('audit_events', token, {
      tenant_id: tenantId,
      actor_user_id: session.user.id,
      action,
      payload,
      created_at: nowIso()
    });
  }
};
