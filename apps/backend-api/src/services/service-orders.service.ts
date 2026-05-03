import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import { enforcePlanLimits } from './plans.js';
import type {
  ServiceOrderDto,
  ServiceOrderCreateRequestDto,
  ServiceOrderStatusUpdateRequestDto,
  DashboardSummaryDto,
  TimelineEventDto,
  EvidenceUploadRequest
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};
const fallbackFolio = (tenantId: string): string =>
  `SO-${tenantId.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-8)}`;

type StatusRow = { id: string; status: string };
type QuoteRow = { status: string; total_mxn?: number | null };
type CurrentOrderRow = { id: string; tenant_id: string; status: string };

export const serviceOrdersService = {
  async dashboardSummary(token: string): Promise<DashboardSummaryDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    // 🔐 Filtros por tenant
    const [orders, customers, quotes] = await Promise.all([
      supabase.query<StatusRow[]>(`service_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,status`, token),
      supabase.query<Array<{ id: string }>>(`customers?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`, token),
      supabase.query<QuoteRow[]>(`quotations?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,status,total_mxn`, token)
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

  async createServiceOrder(token: string, request: ServiceOrderCreateRequestDto): Promise<ServiceOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    if (session.subscription) {
      const orders = await supabase.query<Array<{ id: string }>>(`service_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`, token);
      enforcePlanLimits(session.subscription.plan, orders.length, 'maxServiceOrders');
    }

    let folio = fallbackFolio(tenantId);
    try {
      const next = await supabase.rpc<{ folio: string }>('next_tenant_folio', token, { p_tenant_id: tenantId, p_domain: 'service_order' });
      if (next && typeof next.folio === 'string' && next.folio.trim()) {
        folio = next.folio.trim();
      }
    } catch (error) {
      console.warn({ error, tenantId }, 'next_tenant_folio failed; using fallback folio');
    }
    const created = await supabase.insert<ServiceOrderDto[]>('service_orders', token, {
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      folio,
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
    return created[0];
  },

  async listServiceOrders(token: string): Promise<ServiceOrderDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    // 🔐 Filtro por tenant
    return supabase.query<ServiceOrderDto[]>(`service_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&order=updated_at.desc&select=*`, token);
  },

  async updateServiceOrderStatus(token: string, serviceOrderId: string, req: ServiceOrderStatusUpdateRequestDto): Promise<ServiceOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    const current = await supabase.query<CurrentOrderRow[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&select=id,tenant_id,status`, token);
    const order = current[0];
    assert(Boolean(order), 'Orden no encontrada');
    // 🔐 Verificar que la orden pertenezca al tenant
    if (order.tenant_id !== tenantId) throw new Error('Acceso denegado a la orden');

    const policy = await supabase.query<Array<{ id: string }>>(
      `status_transition_policy?entity=eq.service_order&from_status=eq.${encodeURIComponent(String(order.status))}&to_status=eq.${encodeURIComponent(req.status)}&select=id`,
      token
    );
    assert(policy.length > 0, 'Transición de estado no permitida por política');

    const updated = await supabase.patch<ServiceOrderDto[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&select=*`, token, {
      status: req.status,
      updated_at: nowIso()
    });

    await supabase.insert('service_order_timeline', token, {
      service_order_id: serviceOrderId,
      from_status: order.status,
      to_status: req.status,
      note: req.note ?? null,
      created_at: nowIso()
    });

    await this.audit(token, 'service_order.status_changed', { serviceOrderId, from: order.status, to: req.status });
    return updated[0];
  },

  async listStatusTimeline(token: string, serviceOrderId: string): Promise<TimelineEventDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    // 🔐 Asegurar que la orden pertenezca al tenant (usando subconsulta)
    const orderCheck = await supabase.query<{ tenant_id: string }[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&select=tenant_id`, token);
    if (!orderCheck[0] || orderCheck[0].tenant_id !== tenantId) {
      throw new Error('Orden no encontrada o fuera del tenant');
    }
    return supabase.query<TimelineEventDto[]>(`service_order_timeline?service_order_id=eq.${encodeURIComponent(serviceOrderId)}&order=created_at.asc&select=*`, token);
  },

  async getPortalOrderPublic(folio: string): Promise<Array<{ id: string; folio: string; status: string }>> {
    // Este método es público, no requiere tenant check ya que se usa con service role
    return supabase.queryAsService<Array<{ id: string; folio: string; status: string }>>(
      `service_orders?folio=eq.${encodeURIComponent(folio.toUpperCase())}&select=id,folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,file_assets(id,path,is_public,mime_type)`
    );
  },

  async signedUpload(token: string, request: EvidenceUploadRequest): Promise<{ signedUrl: string }> {
    // Verificar permisos del tenant para la ruta del archivo (se asume que el path contiene tenant_id)
    const session = await loadSession(token);
    requireActiveSubscription(session);
    // Opcional: validar que el path incluya el tenant_id
    return supabase.storageSignedUpload(request.bucket, request.path, token, request.expiresInSeconds ?? 600);
  },

  async audit(token: string, action: string, payload: unknown): Promise<void> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);
    await supabase.insert('audit_events', token, {
      tenant_id: tenantId,
      actor_user_id: session.user.id,
      action,
      payload,
      created_at: nowIso()
    });
  }
};
