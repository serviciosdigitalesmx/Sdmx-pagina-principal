import { randomUUID, createHmac } from 'node:crypto';
import { supabase } from '../services/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../core/logger.js';
import type { CustomerContactCreateRequest, CustomerCreateRequest, EvidenceUploadRequest, QuoteCreateRequest, RegisterRequest, ServiceOrderCreateRequest, ServiceOrderStatusUpdateRequest, SessionData } from '../types/contracts.js';

const IVA_RATE = 0.16;
const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(message); };

export const appService = {
  async register(payload: RegisterRequest): Promise<Record<string, unknown>> {
    // 1. Asegurar que el tenant existe (o crearlo)
    let tenantId = payload.tenantId;
    
    // Si el tenantId no es un UUID válido, o si queremos ser robustos, buscamos/creamos por slug
    const tenantSlug = payload.tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';
    
    const existingTenants = await supabase.queryAsService<Record<string, unknown>[]>(`tenants?slug=eq.${encodeURIComponent(tenantSlug)}&select=id`);
    
    if (existingTenants && existingTenants.length > 0) {
      tenantId = String(existingTenants[0].id);
    } else {
      const newTenants = await supabase.insertAsService<Record<string, unknown>[]>('tenants', {
        name: payload.tenantId,
        slug: tenantSlug
      });
      tenantId = String(newTenants[0].id);
    }

    // 2. Crear el usuario en Auth (Supabase)
    const auth = await supabase.authAdminCreate(payload.email, payload.password);
    
    // 3. Crear el perfil de usuario vinculado al tenant
    const profile = await supabase.insertAsService<Record<string, unknown>[]>('users', {
      id: randomUUID(),
      auth_user_id: auth.id,
      tenant_id: tenantId,
      full_name: payload.fullName,
      email: payload.email
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

    const tenantId = await this.resolveTenantId(user, accessToken);
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

  async subscriptionStatus(token: string): Promise<{ subscription: Record<string, unknown> | null }> {
    const session = await this.sessionFromToken(token);
    const tenantId = String(session.shop.id);

    const subscriptions = await supabase.query<Record<string, unknown>[]>(
      `subscriptions?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=1&select=*`,
      token
    );

    return {
      subscription: subscriptions[0] ?? null
    };
  },

  async resolveTenantId(user: Record<string, unknown>, token: string): Promise<string> {
    const explicitTenantId = user.tenant_id ? String(user.tenant_id) : '';
    if (explicitTenantId) return explicitTenantId;

    const branchId = user.branch_id ? String(user.branch_id) : '';
    assert(Boolean(branchId), 'El usuario no tiene tenant ni branch asignado');

    const branches = await supabase.query<Record<string, unknown>[]>(`branches?id=eq.${encodeURIComponent(branchId)}&select=tenant_id`, token);
    const tenantId = branches[0]?.tenant_id ? String(branches[0].tenant_id) : '';
    assert(Boolean(tenantId), 'No se pudo resolver el tenant del usuario');
    return tenantId;
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
    const session = await this.sessionFromToken(token);
    const tenantId = String(session.shop.id);

    const next = await supabase.rpc<{ folio: string }>('next_tenant_folio', token, { p_tenant_id: tenantId, p_domain: 'service_order' });
    const created = await supabase.insert<Record<string, unknown>[]>('service_orders', token, {
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      folio: next.folio,
      customer_id: request.customerId,
      status: 'recibido',
      device_type: request.deviceType,
      device_brand: request.deviceBrand,
      device_model: request.deviceModel,
      reported_issue: request.reportedIssue,
      estimated_cost: request.estimatedCost ?? null,
      notes: request.notes ?? null,
      reception_checklist: request.receptionChecklist ?? null,
      reception_photo_base64: request.receptionPhotoBase64 ?? null,
      source_quote_folio: request.sourceQuoteFolio ?? null,
      promised_date: request.promisedDate ?? null,
      created_at: nowIso(),
      updated_at: nowIso()
    });
    await this.audit(token, 'service_order.created', created[0] ?? {});
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

    await this.audit(token, 'service_order.status_changed', { serviceOrderId, from: order.status, to: req.status });
    return updated[0] ?? {};
  },

  listStatusTimeline(token: string, serviceOrderId: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`service_order_timeline?service_order_id=eq.${encodeURIComponent(serviceOrderId)}&order=created_at.asc&select=*`, token);
  },

  listCustomers(token: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`customers?order=created_at.desc&select=*`, token);
  },

  async createCustomer(token: string, request: CustomerCreateRequest): Promise<Record<string, unknown>> {
    const session = await this.sessionFromToken(token);
    const tenantId = String(session.shop.id);

    const created = await supabase.insert<Record<string, unknown>[]>('customers', token, {
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      full_name: request.fullName,
      email: request.email,
      phone: request.phone ?? null,
      created_at: nowIso()
    });
    await this.audit(token, 'customer.created', created[0] ?? {});
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
    const session = await this.sessionFromToken(token);
    const tenantId = String(session.shop.id);

    const subtotal = Number(request.subtotalMxn);
    const vat = request.vatMxn > 0 ? Number(request.vatMxn) : Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + vat).toFixed(2));
    const advance = Number(request.advanceMxn ?? 0);
    const balance = Number((total - advance).toFixed(2));

    const created = await supabase.insert<Record<string, unknown>[]>('quotations', token, {
      tenant_id: tenantId,
      service_order_id: request.serviceOrderId,
      subtotal_mxn: subtotal,
      vat_mxn: vat,
      total_mxn: total,
      advance_mxn: advance,
      balance_mxn: balance,
      status: 'draft',
      created_at: nowIso()
    });
    await this.audit(token, 'quote.created', created[0] ?? {});
    return created[0] ?? {};
  },

  getPortalOrderPublic(folio: string): Promise<Record<string, unknown>[]> {
    return supabase.queryAsService<Record<string, unknown>[]>(`service_orders?folio=eq.${encodeURIComponent(folio.toUpperCase())}&select=id,folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,file_assets(id,path,is_public,mime_type)`);
  },

  signedUpload(token: string, request: EvidenceUploadRequest): Promise<Record<string, unknown>> {
    return supabase.storageSignedUpload(request.bucket, request.path, token, request.expiresInSeconds ?? 600);
  },

  listAuditEvents(token: string): Promise<Record<string, unknown>[]> {
    return supabase.query<Record<string, unknown>[]>(`audit_events?order=created_at.desc&select=*`, token);
  },

  async audit(token: string, action: string, payload: unknown): Promise<void> {
    const session = await this.sessionFromToken(token);
    const tenantId = String(session.shop.id);
    await supabase.insert('audit_events', token, {
      tenant_id: tenantId,
      actor_user_id: session.user.id,
      action,
      payload,
      created_at: nowIso()
    });
  },

  async createCheckout(token: string, request: { plan: 'basic' | 'pro' | 'enterprise' }): Promise<{ initPoint: string; preferenceId?: string }> {
    if (!env.mpAccessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    const session = await this.sessionFromToken(token);
    const tenantId = String((session.shop as Record<string, unknown>).id || '');

    assert(Boolean(tenantId), 'No se pudo resolver tenant para checkout');

    const prices: Record<string, number> = {
      basic: 300,
      pro: 450,
      enterprise: 600
    };

    const amount = prices[request.plan];
    assert(Boolean(amount), 'Plan inválido');

    const preference = {
      items: [
        {
          title: `Servicios Digitales MX - Plan ${request.plan}`,
          quantity: 1,
          currency_id: 'MXN',
          unit_price: amount
        }
      ],
      back_urls: {
        success: `${env.appUrl || 'https://sdmx-pagina-principal.vercel.app'}/billing/success`,
        failure: `${env.appUrl || 'https://sdmx-pagina-principal.vercel.app'}/billing/failure`,
        pending: `${env.appUrl || 'https://sdmx-pagina-principal.vercel.app'}/billing/pending`
      },
      auto_return: 'approved',
      notification_url: `${env.webhookBaseUrl || 'https://sdmx-backend-api.onrender.com'}/api/webhooks/mercadopago`,
      metadata: {
        tenantId,
        plan: request.plan
      }
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.mpAccessToken}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const json = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error(String(json.message || 'Mercado Pago rechazó la preferencia'));
    }

    const initPoint = String(json.init_point || json.sandbox_init_point || '');
    assert(Boolean(initPoint), 'Mercado Pago no devolvió init_point');

    try {
      await supabase.insertAsService('subscriptions', {
        tenant_id: tenantId,
        plan: request.plan,
        status: 'pending',
        provider: 'mercadopago',
        external_id: String(json.id || `preference_${Date.now()}`),
        raw_payload: json
      });
    } catch (error) {
      logger.error({ error, tenantId }, 'No se pudo registrar la suscripcion pendiente; continuando con la preferencia');
    }

    return {
      initPoint,
      preferenceId: json.id ? String(json.id) : undefined
    };
  },

  async handleMercadoPagoWebhook(payload: Record<string, unknown>, signature?: string, requestId?: string): Promise<{ received: true }> {
    if (!env.mpAccessToken) throw new Error('MP_ACCESS_TOKEN no configurado');

    const type = String(payload.type || payload.action || '');
    const data = payload.data as Record<string, unknown> | undefined;
    const paymentId = String(data?.id || payload.id || '');

    if (!paymentId || (!type.includes('payment') && !payload.action)) {
      return { received: true };
    }

    // Validación criptográfica de firma (Mandatoria si el secreto está configurado)
    if (env.mpWebhookSecret) {
      if (!signature) {
        logger.error({ paymentId, requestId }, 'Webhook rechazado: Falta x-signature header');
        throw new Error('Missing x-signature header for authenticity validation');
      }

      try {
        const parts = signature.split(',').reduce((acc, part) => {
          const [k, v] = part.split('=');
          if (k && v) acc[k.trim()] = v.trim();
          return acc;
        }, {} as Record<string, string>);

        const ts = parts['ts'];
        const v1 = parts['v1'];

        if (!ts || !v1) throw new Error('Malformed x-signature header: missing ts or v1');

        // Anti-replay: 10 minutos
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - Number(ts)) > 600) throw new Error('Webhook signature expired (anti-replay check failed)');

        // Template para pagos: id:[payment_id];topic:payment;ts:[ts];
        const topic = type.includes('payment') ? 'payment' : type;
        const template = `id:${paymentId};topic:${topic};ts:${ts};`;
        const calculated = createHmac('sha256', env.mpWebhookSecret).update(template).digest('hex');

        if (calculated !== v1) {
          throw new Error('Invalid cryptographic signature: HMAC mismatch');
        }
        logger.info({ paymentId, requestId }, 'Webhook signature verified successfully via HMAC-SHA256');
      } catch (error) {
        logger.error({ error: (error as Error).message, signature, paymentId }, 'Webhook signature validation failed');
        throw error; // Bloqueamos el proceso si la firma es inválida
      }
    }

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        authorization: `Bearer ${env.mpAccessToken}`
      }
    });

    const payment = await response.json().catch(() => ({})) as Record<string, unknown>;

    if (!response.ok) {
      throw new Error('No se pudo consultar pago en Mercado Pago');
    }

    const metadata = (payment.metadata || {}) as Record<string, unknown>;
    const tenantId = String(metadata.tenant_id || metadata.tenantId || '');
    const plan = String(metadata.plan || '');

    if (!tenantId || !['basic', 'pro', 'enterprise'].includes(plan)) {
      return { received: true };
    }

    const mpStatus = String(payment.status || '');
    const status =
      mpStatus === 'approved' ? 'active' :
      mpStatus === 'pending' || mpStatus === 'in_process' ? 'pending' :
      mpStatus === 'rejected' || mpStatus === 'cancelled' ? 'canceled' :
      'past_due';

    try {
      await supabase.insertAsService('subscriptions', {
        tenant_id: tenantId,
        plan,
        status,
        provider: 'mercadopago',
        external_id: paymentId,
        raw_payload: payment
      });
    } catch (error) {
      logger.error({ error, tenantId, paymentId, status, plan }, 'No se pudo persistir el estado de suscripcion desde webhook');
    }

    await supabase.insertAsService('audit_events', {
      tenant_id: tenantId,
      action: 'billing.mercadopago_webhook',
      payload: { paymentId, status, plan }
    });

    return { received: true };
  },

  async ensureActiveSubscription(token: string): Promise<void> {
    const { subscription } = await this.subscriptionStatus(token);
    const current = subscription;

    if (!current || String(current.status) !== 'active') {
      throw new Error('SUBSCRIPTION_REQUIRED');
    }
  }

};
