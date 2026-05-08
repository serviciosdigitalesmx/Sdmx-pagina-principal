import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  ServiceOrderCreateRequestDto,
  ServiceOrderStatusUpdateRequestDto,
  ServiceOrderDto,
  TimelineEventDto,
  EvidenceUploadRequest
} from '@sdmx/contracts';

export class ServiceOrdersService {
  // Compatibility aliases expected by app-service facade
  async dashboardSummary(token: string) {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const orders = await supabase.query<any[]>(`service_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&select=*`, token);
    const summary = {
      totalServiceOrders: (orders || []).length,
      pending: (orders || []).filter((o) => o.status === 'pending').length,
      diagnosing: (orders || []).filter((o) => o.status === 'diagnosing').length,
      ready: (orders || []).filter((o) => o.status === 'ready').length
    };
    return summary;
  }

  async createServiceOrder(token: string, request: ServiceOrderCreateRequestDto) {
    return this.create(token, request as any);
  }

  async listServiceOrders(token: string) {
    return this.findAll(token);
  }

  async updateServiceOrderStatus(token: string, serviceOrderId: string, req: ServiceOrderStatusUpdateRequestDto) {
    return this.update(token, serviceOrderId, req);
  }

  async listStatusTimeline(token: string, serviceOrderId: string) {
    return this.getHistory(token, serviceOrderId);
  }

  async getPortalOrderPublic(folio: string) {
    return this.findByFolioForClient(folio);
  }

  async create(token: string, request: ServiceOrderCreateRequestDto): Promise<ServiceOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    const payload: any = {
      tenant_id: tenantId,
      branch_id: request.branchId ?? null,
      customer_id: request.customerId,
      device_type: request.deviceType ?? request.deviceInfo?.type ?? null,
      device_brand: request.deviceBrand ?? request.deviceInfo?.brand ?? null,
      device_model: request.deviceModel ?? request.deviceInfo?.model ?? null,
      reported_issue: request.reportedIssue ?? request.problemDescription ?? null,
      serial_number: (request as any).serialNumber ?? null,
      accessories: (request as any).accessories ?? null,
      internal_notes: (request as any).internalNotes ?? null,
      warranty_until: (request as any).warrantyUntil ?? null,
      evidence_metadata: (request as any).evidenceMetadata ?? null,
      estimated_cost: request.estimatedCost ?? null,
      notes: request.notes ?? null,
      reception_checklist: request.receptionChecklist ?? null,
      reception_photo_base64: request.receptionPhotoBase64 ?? null,
      source_quote_folio: request.sourceQuoteFolio ?? null,
      promised_date: request.promisedDate ?? null,
      status: 'received',
      created_at: new Date().toISOString()
    };

    const created = await supabase.insert<any[]>('service_orders', token, payload);
    return created[0];
  }

  async findAll(token: string): Promise<ServiceOrderDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    return supabase.query<ServiceOrderDto[]>(`service_orders?tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&select=*`, token);
  }

  async findById(token: string, id: string): Promise<ServiceOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const rows = await supabase.query<ServiceOrderDto[]>(`service_orders?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
    return (rows && rows[0]) || (null as any);
  }

  async update(token: string, id: string, request: ServiceOrderStatusUpdateRequestDto): Promise<ServiceOrderDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    // Fetch current order to record history
    const existing = await supabase.query<any[]>(`service_orders?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
    const current = existing && existing[0] ? existing[0] : null;

    // Validate status transitions and required fields
    const toStatus = (request as any).status || (request as any).status;
    if (toStatus && current) {
      this._validateStatusTransition(current, toStatus, request);
    }

    // Build patch payload (support updating extended fields)
    const patchPayload: any = Object.assign({}, request);
    patchPayload.updated_at = new Date().toISOString();

    // Ensure multi-tenant patch
    const patched = await supabase.patch<any[]>(`service_orders?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}`, token, patchPayload as any);

    // Insert timeline event
    const fromStatus = current ? (current.status || null) : null;
    await supabase.insert<any[]>('service_order_timeline', token, {
      tenant_id: tenantId,
      service_order_id: id,
      from_status: fromStatus,
      to_status: toStatus,
      note: (request as any).note ?? null,
      actor_user_id: session.user?.id ?? null,
      created_at: new Date().toISOString()
    });

    return (patched && patched[0]) || (null as any);
  }

  async getHistory(token: string, id: string): Promise<TimelineEventDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    return supabase.query<TimelineEventDto[]>(`service_order_timeline?tenant_id=eq.${encodeURIComponent(tenantId)}&service_order_id=eq.${encodeURIComponent(id)}&order=created_at.desc&select=*`, token);
  }

  async findByFolioForClient(folio: string): Promise<ServiceOrderDto> {
    const rows = await supabase.query<ServiceOrderDto[]>(`service_orders?folio=eq.${encodeURIComponent(folio)}&select=*`);
    if (!rows || !rows.length) throw new Error('Orden no encontrada');
    return rows[0];
  }

  // Calculate costs from a list of items (subtotal, vat, total)
  async calculateEstimate(token: string, items: Array<{ quantity: number; unit_cost_mxn: number }>) {
    const IVA_RATE = 0.16;
    const subtotal = Number((items || []).reduce((acc, it) => acc + (Number(it.quantity || 0) * Number(it.unit_cost_mxn || 0)), 0).toFixed(2));
    const vat = Number((subtotal * IVA_RATE).toFixed(2));
    const total = Number((subtotal + vat).toFixed(2));
    return { subtotal, vat, total };
  }

  // Validate allowed status transitions and required fields per transition
  _validateStatusTransition(current: any, toStatus: string, payload: any) {
    const from = current.status;
    // Example rules:
    // - Cannot move to 'ready' or 'delivered' if estimated_cost is missing or zero
    if (['ready', 'delivered', 'terminado'].includes(toStatus)) {
      const cost = Number(payload.total_cost ?? payload.estimated_cost ?? current.estimated_cost ?? 0);
      if (!cost || cost <= 0) {
        throw new Error('No se puede cambiar a "' + toStatus + '" sin un costo final mayor a 0');
      }
    }
    // - Cannot move to 'diagnosing' / 'in_progress' without technician assigned
    if (['diagnosing', 'in_progress', 'en_proceso'].includes(toStatus)) {
      const tech = payload.technician_assigned ?? current.technician_assigned;
      if (!tech) throw new Error('Asignar un técnico antes de mover a "' + toStatus + '"');
    }
    // Additional rules can be added here following legacy behavior
    return true;
  }

  // Validate warranty: checks service_order.warranty_until if available
  async validateWarranty(token: string, serviceOrderId: string): Promise<{ valid: boolean; reason?: string }> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const rows = await supabase.query<any[]>(`service_orders?id=eq.${encodeURIComponent(serviceOrderId)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=*`, token);
    const order = rows && rows[0] ? rows[0] : null;
    if (!order) return { valid: false, reason: 'not_found' };
    if (order.warranty_until) {
      try {
        const until = new Date(order.warranty_until);
        if (isNaN(until.getTime())) return { valid: false, reason: 'invalid_warranty_date' };
        return { valid: new Date() <= until };
      } catch (e) {
        return { valid: false, reason: 'invalid_warranty_date' };
      }
    }
    return { valid: false, reason: 'no_warranty_info' };
  }

  async signedUpload(token: string, request: EvidenceUploadRequest): Promise<{ signedUrl: string }> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);

    const bucket = 'evidences';
    const filePath = `${tenantId}/service_orders/${request.serviceOrderId}/${Date.now()}_${request.fileName}`;

    // Decode base64 payload (support data URLs)
    const data = request.fileData;
    let mime: string | undefined;
    let base64Str = data;
    const matches = /^data:(.+);base64,(.+)$/.exec(data);
    if (matches) {
      mime = matches[1];
      base64Str = matches[2];
    }

    const buffer = Buffer.from(base64Str, 'base64');

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, buffer, {
      upsert: true,
      contentType: mime
    } as any);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Create signed URL valid for 600 seconds (10 minutes)
    const expiresIn = 600;
    const { data: signedData, error: signError } = await supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn);
    if (signError || !signedData) {
      throw new Error(signError?.message || 'Error al generar signed URL');
    }

    return { signedUrl: signedData.signedUrl } as { signedUrl: string };
  }
}

export const serviceOrdersService = new ServiceOrdersService();
