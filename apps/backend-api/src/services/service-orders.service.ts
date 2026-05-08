import { supabase } from './supabase.js';
import { loadSession } from './context.js';
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
    const orders = await this.findAll(token);
    const summary = {
      totalServiceOrders: orders.length,
      pending: orders.filter((o) => o.status === 'pending').length,
      diagnosing: orders.filter((o) => o.status === 'diagnosing').length,
      ready: orders.filter((o) => o.status === 'ready').length
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
    const { data, error } = await supabase
      .from('service_orders')
      .insert({
        tenant_id: request.tenantId,
        branch_id: request.branchId ?? null,
        customer_id: request.customerId,
        device_type: request.deviceType,
        device_brand: request.deviceBrand,
        device_model: request.deviceModel,
        reported_issue: request.reportedIssue,
        estimated_cost: request.estimatedCost,
        notes: request.notes,
        reception_checklist: request.receptionChecklist,
        reception_photo_base64: request.receptionPhotoBase64,
        source_quote_folio: request.sourceQuoteFolio,
        promised_date: request.promisedDate,
        status: 'received'
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(token: string): Promise<ServiceOrderDto[]> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async findById(token: string, id: string): Promise<ServiceOrderDto> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async update(token: string, id: string, request: ServiceOrderStatusUpdateRequestDto): Promise<ServiceOrderDto> {
    const { data, error } = await supabase
      .from('service_orders')
      .update({ status: request.status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getHistory(token: string, id: string): Promise<TimelineEventDto[]> {
    const { data, error } = await supabase
      .from('service_order_timeline')
      .select('*')
      .eq('service_order_id', id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async findByFolioForClient(folio: string): Promise<ServiceOrderDto> {
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .eq('folio', folio)
      .single();
    if (error) throw new Error('Orden no encontrada');
    return data;
  }

  async signedUpload(token: string, request: EvidenceUploadRequest): Promise<{ signedUrl: string }> {
    const session = await loadSession(token);
    const tenantId = session.user.tenant_id;

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
