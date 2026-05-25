import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { getTenantClient, supabaseAdmin } from '@white-label/database';

const defaultOrderStatuses = ['recibido', 'diagnostico', 'reparacion', 'listo', 'entregado'] as const;
const orderStatusSchema = z.string().min(1);

const encodedFileSchema = z.object({
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  base64: z.string().min(1),
  fileType: z.enum(['intake_photo', 'attachment_pdf']),
});

const attachmentRequestSchema = z.object({
  files: z.array(encodedFileSchema).min(1),
});

const noteRequestSchema = z.object({
  note: z.string().min(1),
  actorName: z.string().optional(),
});

const statusRequestSchema = z.object({
  status: orderStatusSchema,
  note: z.string().optional(),
});

type EvidenceEntry =
  | {
      kind: 'document';
      id: string;
      file_name: string;
      file_type: 'intake_photo' | 'attachment_pdf' | 'receipt_pdf';
      public_url: string | null;
      mime_type: string;
      created_at: string;
    }
  | {
      kind: 'event';
      id: string;
      event_type: string;
      previous_status: string | null;
      new_status: string | null;
      note: string | null;
      actor_name: string | null;
      created_at: string;
    };

type TenantBranding = {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
};

type OperationalStatus = {
  key?: string;
  label?: string;
  tone?: string;
};

type OrderDocumentRow = {
  id: string;
  tenant_id: string;
  service_order_id: string;
  bucket_name: string;
  storage_path: string;
  public_url: string | null;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  file_size: number | null;
  source: string;
  created_at: string;
};

type OrderEventRow = {
  id: string;
  tenant_id: string;
  service_order_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  note: string | null;
  actor_name: string | null;
  created_at: string;
};

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildPdfAttachment(receiptUrl?: string | null) {
  if (!receiptUrl) {
    return null;
  }

  const isDataUrl = receiptUrl.startsWith('data:');
  return {
    type: 'receipt_pdf' as const,
    label: 'PDF de la orden',
    url: receiptUrl,
    fileName: isDataUrl ? null : 'recepcion.pdf',
    mimeType: 'application/pdf',
    source: isDataUrl ? ('inline_data_url' as const) : ('stored_url' as const),
  };
}

// Esquema de validación para la creación de órdenes
const createOrderSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  clientEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  deviceType: z.string().min(1, 'El tipo de dispositivo es requerido'),
  deviceModel: z.string().min(1, 'La marca y modelo son requeridos'),
  issue: z.string().min(1, 'La falla es requerida'),
  quoteFolio: z.string().optional(),
  estimatedCost: z.coerce.number().min(0).default(0),
  promisedDate: z.string().optional().or(z.literal('')),
  includeIva: z.coerce.boolean().default(false),
  checklist: z.object({
    hasCharger: z.coerce.boolean().default(false),
    screenCondition: z.string().optional().default(''),
    powersOn: z.coerce.boolean().default(false),
    backupRequired: z.coerce.boolean().default(false),
    notes: z.string().optional().default(''),
  }).default({
    hasCharger: false,
    screenCondition: '',
    powersOn: false,
    backupRequired: false,
    notes: '',
  }),
  receiptUrl: z.string().optional().or(z.literal('')),
  branchId: z.string().min(1).optional(),
});

function normalizeOrderStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('diag')) return 'diagnostico';
  if (value.includes('repar')) return 'reparacion';
  if (value.includes('list')) return 'listo';
  if (value.includes('entreg')) return 'entregado';
  return 'recibido';
}

function getStorageBucketName() {
  return process.env.SUPABASE_ORDER_BUCKET ?? 'order-assets';
}

function getFileExtension(fileName: string, mimeType: string) {
  if (mimeType === 'application/pdf') return 'pdf';
  const lower = fileName.toLowerCase();
  const dotIndex = lower.lastIndexOf('.');
  return dotIndex >= 0 ? lower.slice(dotIndex + 1) : mimeType.split('/').pop() ?? 'bin';
}

function decodeBase64File(base64: string) {
  const cleaned = base64.includes(',') ? base64.split(',').pop() ?? '' : base64;
  return Buffer.from(cleaned, 'base64');
}

function readEvidenceMetadata(input: unknown): EvidenceEntry[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter(Boolean) as EvidenceEntry[];
}

function appendEvidenceEntry(input: unknown, entry: EvidenceEntry) {
  return [...readEvidenceMetadata(input), entry];
}

function normalizeOrderDocuments(rows: OrderDocumentRow[] | null | undefined, metadata: EvidenceEntry[]) {
  const tableDocuments = (rows ?? []).map((row) => ({
    id: row.id,
    file_name: row.file_name,
    file_type: row.file_type,
    public_url: row.public_url,
    mime_type: row.mime_type ?? 'application/octet-stream',
    created_at: row.created_at,
    source: row.source ?? 'upload',
  }));

  const metadataDocuments = metadata
    .filter((entry): entry is Extract<EvidenceEntry, { kind: 'document' }> => entry.kind === 'document')
    .map((entry) => ({
      id: entry.id,
      file_name: entry.file_name,
      file_type: entry.file_type,
      public_url: entry.public_url,
      mime_type: entry.mime_type,
      created_at: entry.created_at,
      source: 'metadata',
    }));

  const documents = [...tableDocuments, ...metadataDocuments];
  const deduped = new Map<string, (typeof documents)[number]>();
  for (const document of documents) {
    deduped.set(document.id, document);
  }
  return [...deduped.values()];
}

function normalizeOrderEvents(rows: OrderEventRow[] | null | undefined, metadata: EvidenceEntry[]) {
  const tableEvents = (rows ?? []).map((row) => ({
    id: row.id,
    event_type: row.event_type,
    previous_status: row.previous_status,
    new_status: row.new_status,
    note: row.note,
    actor_name: row.actor_name,
    created_at: row.created_at,
  }));

  const metadataEvents = metadata
    .filter((entry): entry is Extract<EvidenceEntry, { kind: 'event' }> => entry.kind === 'event')
    .map((entry) => ({
      id: entry.id,
      event_type: entry.event_type,
      previous_status: entry.previous_status,
      new_status: entry.new_status,
      note: entry.note,
      actor_name: entry.actor_name,
      created_at: entry.created_at,
    }));

  const events = [...tableEvents, ...metadataEvents];
  const deduped = new Map<string, (typeof events)[number]>();
  for (const event of events) {
    deduped.set(event.id, event);
  }
  return [...deduped.values()];
}

async function insertOrderDocument(supabase: ReturnType<typeof getTenantClient>, row: {
  id: string;
  tenant_id: string;
  service_order_id: string;
  bucket_name: string;
  storage_path: string;
  public_url: string | null;
  file_name: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  source: string;
}) {
  const { error } = await supabase.from('service_order_documents').insert([row]);
  if (error) {
    throw new Error(`Failed to persist service_order_documents: ${error.message}`);
  }
}

async function insertOrderEvent(supabase: ReturnType<typeof getTenantClient>, row: {
  id: string;
  tenant_id: string;
  service_order_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string | null;
  note: string | null;
  actor_name: string | null;
}) {
  const { error } = await supabase.from('service_order_events').insert([row]);
  if (error) {
    throw new Error(`Failed to persist service_order_events: ${error.message}`);
  }
}

async function getTenantBranding(tenantId: string): Promise<{ name: string; branding: TenantBranding | null }> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('name, branding')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return { name: 'Sr. Fix', branding: null };
  }

  return {
    name: String(data.name ?? 'Sr. Fix'),
    branding: (data.branding as TenantBranding | null) ?? null,
  };
}

async function getTenantOperationalStatuses(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('operational_settings')
    .eq('id', tenantId)
    .single();

  if (error || !data) {
    return defaultOrderStatuses.map((status) => ({ key: status, label: status, tone: 'zinc' }));
  }

  const settings = data.operational_settings as { orderStatuses?: OperationalStatus[] } | null;
  const statuses = settings?.orderStatuses?.filter((item) => typeof item?.key === 'string' && item.key.trim().length > 0);
  if (statuses && statuses.length > 0) {
    return statuses.map((status) => ({
      key: String(status.key),
      label: String(status.label ?? status.key),
      tone: String(status.tone ?? 'zinc'),
    }));
  }

  return defaultOrderStatuses.map((status) => ({ key: status, label: status, tone: 'zinc' }));
}

async function getAllowedOrderStatusKeys(tenantId: string) {
  const statuses = await getTenantOperationalStatuses(tenantId);
  return new Set(statuses.map((status) => status.key ?? '').filter(Boolean));
}

async function generateReceiptPdf(options: {
  order: Record<string, unknown>;
  tenantName: string;
  tenantBranding?: TenantBranding | null;
  photo?: {
    buffer: Buffer;
    mimeType: string;
    fileName: string;
  } | null;
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer | Uint8Array) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

  const ended = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const primaryColor = options.tenantBranding?.primaryColor || '#2c6e9f';
  const secondaryColor = options.tenantBranding?.secondaryColor || '#0f172a';
  const logoUrl = options.tenantBranding?.logoUrl?.trim() || '';

  doc.rect(40, 40, 515, 70).fill(primaryColor);
  doc.fillColor('#ffffff').fontSize(20).text(options.tenantName || 'Sr. Fix', 58, 58, { width: 340 });
  doc.fillColor('#ffffff').fontSize(10).text('Comprobante de recepción', 58, 82, { width: 340 });
  doc.fillColor('#ffffff').fontSize(9).text('Documento generado automáticamente', 420, 60, { width: 120, align: 'right' });
  doc.moveDown(3.5);

  if (logoUrl) {
    try {
      const response = await fetch(logoUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        doc.image(Buffer.from(arrayBuffer), 415, 128, { fit: [110, 52] });
      }
    } catch {
      doc.rect(415, 128, 110, 52).lineWidth(1).strokeColor(primaryColor).stroke();
      doc.fillColor(primaryColor).fontSize(8).text('Logo no disponible', 420, 150, { width: 100, align: 'center' });
    }
  }

  doc.fillColor(secondaryColor).fontSize(18).text('Comprobante de Recepción', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#374151').text(`Folio: ${String(options.order.folio ?? '')}`);
  doc.text(`Cliente: ${String((options.order.device_info as { customer_name?: string } | undefined)?.customer_name ?? '')}`);
  doc.text(`Teléfono: ${String((options.order.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? '')}`);
  doc.text(`Correo: ${String((options.order.device_info as { customer_email?: string } | undefined)?.customer_email ?? '')}`);
  doc.text(`Equipo: ${String((options.order.device_info as { type?: string } | undefined)?.type ?? options.order.device_type ?? '')} - ${String(options.order.device_model ?? '')}`);
  doc.text(`Problema: ${String(options.order.problem_description ?? '')}`);
  doc.text(`Estado: ${String(options.order.status ?? '')}`);
  doc.text(`Fecha: ${new Date().toLocaleString('es-MX')}`);

  doc.moveDown(0.75);
  doc.fontSize(12).fillColor(secondaryColor).text('Evidencia fotográfica', { underline: true });
  doc.moveDown(0.5);

  if (options.photo) {
    try {
      doc.image(options.photo.buffer, {
        fit: [500, 280],
        align: 'center',
        valign: 'center',
      });
    } catch {
      doc.fontSize(10).fillColor('#6b7280').text('La evidencia fotográfica no pudo incrustarse en el PDF, pero sí quedó almacenada como archivo.');
    }
  } else {
    doc.fontSize(10).fillColor('#6b7280').text('No se recibió evidencia fotográfica en este flujo.');
  }

  doc.moveDown(0.8);
  doc.fontSize(10).fillColor('#6b7280').text(`Documento generado automáticamente por ${options.tenantName || 'Sr. Fix'}.`);
  doc.end();

  return ended;
}

async function ensureBucketExists(bucketName: string) {
  const { error } = await supabaseAdmin.storage.getBucket(bucketName);
  if (!error) {
    return;
  }
  const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: 52428800,
  });
  if (createError) {
    throw new Error(`Unable to ensure storage bucket ${bucketName}: ${createError.message}`);
  }
}

async function uploadBufferToStorage(options: {
  tenantId: string;
  orderId: string;
  bucketName: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  fileType: 'intake_photo' | 'attachment_pdf' | 'receipt_pdf';
}) {
  const storagePath = `tenant/${options.tenantId}/orders/${options.orderId}/${Date.now()}-${options.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(options.bucketName)
    .upload(storagePath, options.buffer, {
      contentType: options.mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload ${options.fileType}: ${uploadError.message}`);
  }

  const { data: publicData } = supabaseAdmin.storage.from(options.bucketName).getPublicUrl(storagePath);
  return {
    storagePath,
    publicUrl: publicData.publicUrl ?? null,
  };
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const validatedData = createOrderSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const requestedBranchId = isUuid(validatedData.branchId)
      ? validatedData.branchId
      : isUuid(req.user?.sucursalId)
        ? req.user?.sucursalId
        : null;

    if (req.user?.role === 'manager' && req.user.sucursalId && requestedBranchId && requestedBranchId !== req.user.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const folioPrefix = process.env.ORDER_FOLIO_PREFIX ?? 'ORD';
    const newFolio = `${folioPrefix}-${Date.now().toString(36).toUpperCase()}`;
    const estimatedCost = Number.isFinite(validatedData.estimatedCost) ? validatedData.estimatedCost : 0;
    const ivaAmount = validatedData.includeIva ? Number((estimatedCost * 0.16).toFixed(2)) : 0;
    const finalCost = Number((estimatedCost + ivaAmount).toFixed(2));

    const { data, error } = await supabase
      .from('service_orders')
      .insert([
        {
          tenant_id: tenantId,
          branch_id: requestedBranchId,
          folio: newFolio,
          status: 'recibido',
          device_info: {
            brand: validatedData.deviceModel,
            model: validatedData.deviceModel,
            type: validatedData.deviceType,
            customer_name: validatedData.clientName,
            customer_phone: validatedData.clientPhone,
            customer_email: validatedData.clientEmail || null,
          },
          problem_description: validatedData.issue,
          estimated_cost: estimatedCost,
          final_cost: finalCost,
          promised_date: validatedData.promisedDate || null,
          receipt_url: validatedData.receiptUrl || null,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(502).json({
        error: 'Failed to persist order',
        details: error.message,
      });
    }

    const checklist = validatedData.checklist ?? {
      hasCharger: false,
      screenCondition: '',
      powersOn: false,
      backupRequired: false,
      notes: '',
    };

    const { error: checklistError } = await supabase.from('service_order_checklists').insert([
      {
        tenant_id: tenantId,
        service_order_id: data.id,
        has_charger: checklist.hasCharger,
        screen_condition: checklist.screenCondition || null,
        powers_on: checklist.powersOn,
        backup_required: checklist.backupRequired,
        notes: checklist.notes || null,
      },
    ]);

    if (checklistError) {
      console.error('Supabase checklist insert error:', checklistError.message);
      return res.status(502).json({
        error: 'Failed to persist order checklist',
        details: checklistError.message,
      });
    }

    const createdEventId = randomUUID();
    await supabase
      .from('service_orders')
      .update({
        evidence_metadata: appendEvidenceEntry(data.evidence_metadata, {
          kind: 'event',
          id: createdEventId,
          event_type: 'created',
          previous_status: null,
          new_status: 'recibido',
          note: validatedData.issue,
          actor_name: req.user?.email ?? req.user?.role ?? 'system',
          created_at: new Date().toISOString(),
        }),
      })
      .eq('tenant_id', tenantId)
      .eq('id', data.id);

    await insertOrderEvent(supabase, {
      id: createdEventId,
      tenant_id: tenantId,
      service_order_id: data.id,
      event_type: 'created',
      previous_status: null,
      new_status: 'recibido',
      note: validatedData.issue,
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    const pdfAttachment = buildPdfAttachment(validatedData.receiptUrl || null);

    return res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        ...data,
        final_cost: finalCost,
        estimated_cost: estimatedCost,
        receipt_url: validatedData.receiptUrl || null,
        branch_id: requestedBranchId,
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
        include_iva: validatedData.includeIva,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Datos de validación incorrectos',
        details: error.errors,
      });
    }
    console.error('Error creating order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    let query = supabase
      .from('service_orders')
      .select('*, service_order_checklists(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (isUuid(branchId)) {
      query = query.eq('branch_id', branchId);
    } else if (req.user?.role === 'manager' && isUuid(req.user.sucursalId)) {
      query = query.eq('branch_id', req.user.sucursalId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(502).json({
        error: 'Failed to fetch orders',
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const supabase = getTenantClient(tenantId);
    const orderQuery = supabase
      .from('service_orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

    if (isUuid(branchId)) {
      orderQuery.eq('branch_id', branchId);
    } else if (req.user?.role === 'manager' && isUuid(req.user.sucursalId)) {
      orderQuery.eq('branch_id', req.user.sucursalId);
    }

    const [orderResult, checklistResult, documentsResult, eventsResult] = await Promise.all([
      orderQuery.single(),
      supabase
        .from('service_order_checklists')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .maybeSingle(),
      supabase
        .from('service_order_documents')
        .select('id, tenant_id, service_order_id, bucket_name, storage_path, public_url, file_name, file_type, mime_type, file_size, source, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true }),
      supabase
        .from('service_order_events')
        .select('id, tenant_id, service_order_id, event_type, previous_status, new_status, note, actor_name, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true }),
    ]);

    if (orderResult.error || !orderResult.data) {
      return res.status(404).json({
        error: 'Order not found',
        details: orderResult.error?.message ?? 'Not found',
      });
    }

    if (checklistResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order checklist', details: checklistResult.error.message });
    }

    if (documentsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order documents', details: documentsResult.error.message });
    }

    if (eventsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order events', details: eventsResult.error.message });
    }

    const evidenceMetadata = readEvidenceMetadata(orderResult.data.evidence_metadata);
    const documents = normalizeOrderDocuments(documentsResult.data ?? [], evidenceMetadata);
    const events = normalizeOrderEvents(eventsResult.data ?? [], evidenceMetadata);
    const pdfAttachment = buildPdfAttachment(
      orderResult.data.receipt_url || documents.find((document) => document.file_type === 'receipt_pdf' && document.public_url)?.public_url || null
    );

    return res.json({
      success: true,
      data: {
        order: orderResult.data,
        documents,
        events,
        checklist: checklistResult.data ?? null,
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
      },
    });
  } catch (error) {
    console.error('Error getting order by id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const uploadOrderAttachments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const parsed = attachmentRequestSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, tenant_id, evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(isUuid(branchId) ? 'branch_id' : 'tenant_id', isUuid(branchId) ? branchId : tenantId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const bucketName = getStorageBucketName();
    await ensureBucketExists(bucketName);
    const tenantBranding = await getTenantBranding(tenantId);

    const createdDocuments = [];
    let uploadedPhoto: { buffer: Buffer; mimeType: string; fileName: string } | null = null;
    for (const file of parsed.files) {
      const fileBuffer = decodeBase64File(file.base64);
      const extension = getFileExtension(file.fileName, file.mimeType);
      const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `tenant/${tenantId}/orders/${orderId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage.from(bucketName).upload(storagePath, fileBuffer, {
        contentType: file.mimeType,
        upsert: false,
      });

      if (uploadError) {
        return res.status(502).json({
          error: 'Failed to upload attachment',
          details: uploadError.message,
        });
      }

      const { data: publicData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(storagePath);
      const documentId = randomUUID();
      const documentRow = {
        id: documentId,
        tenant_id: tenantId,
        service_order_id: orderId,
        bucket_name: bucketName,
        storage_path: storagePath,
        public_url: publicData.publicUrl ?? null,
        file_name: file.fileName,
        file_type: file.fileType,
        mime_type: file.mimeType,
        file_size: fileBuffer.length,
        source: 'upload',
        created_by: null,
        created_at: new Date().toISOString(),
        extension,
      };
      createdDocuments.push(documentRow);

      await insertOrderDocument(supabase, {
        id: documentId,
        tenant_id: tenantId,
        service_order_id: orderId,
        bucket_name: bucketName,
        storage_path: storagePath,
        public_url: publicData.publicUrl ?? null,
        file_name: file.fileName,
        file_type: file.fileType,
        mime_type: file.mimeType,
        file_size: fileBuffer.length,
        source: 'upload',
      });

      const { data: latestDocumentEvidence } = await supabase
        .from('service_orders')
        .select('evidence_metadata')
        .eq('tenant_id', tenantId)
        .eq('id', orderId)
        .single();

      await supabase
        .from('service_orders')
        .update({
          evidence_metadata: appendEvidenceEntry(latestDocumentEvidence?.evidence_metadata, {
            kind: 'document',
            id: documentId,
            file_name: file.fileName,
            file_type: file.fileType,
            public_url: publicData.publicUrl ?? null,
            mime_type: file.mimeType,
            created_at: new Date().toISOString(),
          }),
        })
        .eq('tenant_id', tenantId)
        .eq('id', orderId);

      if (file.fileType === 'intake_photo') {
        uploadedPhoto = {
          buffer: fileBuffer,
          mimeType: file.mimeType,
          fileName: file.fileName,
        };
      }
    }

    if (uploadedPhoto) {
      const { data: latestOrder, error: latestOrderError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', orderId)
        .single();

      if (latestOrderError || !latestOrder) {
        return res.status(404).json({ error: 'Order not found', details: latestOrderError?.message ?? 'Not found' });
      }

      const receiptPdfBuffer = await generateReceiptPdf({
        order: latestOrder,
        photo: uploadedPhoto,
        tenantName: tenantBranding.name,
        tenantBranding: tenantBranding.branding,
      });
      const receiptUpload = await uploadBufferToStorage({
        tenantId,
        orderId,
        bucketName,
        fileName: 'recepcion.pdf',
        mimeType: 'application/pdf',
        buffer: receiptPdfBuffer,
        fileType: 'receipt_pdf',
      });

      const { data: latestReceiptOrder, error: latestReceiptOrderError } = await supabase
        .from('service_orders')
        .select('evidence_metadata')
        .eq('tenant_id', tenantId)
        .eq('id', orderId)
        .single();

      if (latestReceiptOrderError) {
        return res.status(502).json({
          error: 'Failed to persist receipt evidence',
          details: latestReceiptOrderError.message,
        });
      }

      const receiptDocumentId = randomUUID();
      const { error: receiptUpdateError } = await supabase
        .from('service_orders')
        .update({
          receipt_url: receiptUpload.publicUrl,
          evidence_metadata: appendEvidenceEntry(latestReceiptOrder?.evidence_metadata, {
            kind: 'document',
            id: receiptDocumentId,
            file_name: 'recepcion.pdf',
            file_type: 'receipt_pdf',
            public_url: receiptUpload.publicUrl,
            mime_type: 'application/pdf',
            created_at: new Date().toISOString(),
          }),
        })
        .eq('tenant_id', tenantId)
        .eq('id', orderId);

      if (receiptUpdateError) {
        return res.status(502).json({
          error: 'Failed to persist receipt url',
          details: receiptUpdateError.message,
        });
      }

      createdDocuments.push({
        id: receiptDocumentId,
        tenant_id: tenantId,
        service_order_id: orderId,
        bucket_name: bucketName,
        storage_path: receiptUpload.storagePath,
        public_url: receiptUpload.publicUrl,
        file_name: 'recepcion.pdf',
        file_type: 'receipt_pdf',
        mime_type: 'application/pdf',
        file_size: receiptPdfBuffer.length,
        source: 'generated',
        created_by: null,
        created_at: new Date().toISOString(),
      });

      await insertOrderDocument(supabase, {
        id: receiptDocumentId,
        tenant_id: tenantId,
        service_order_id: orderId,
        bucket_name: bucketName,
        storage_path: receiptUpload.storagePath,
        public_url: receiptUpload.publicUrl,
        file_name: 'recepcion.pdf',
        file_type: 'receipt_pdf',
        mime_type: 'application/pdf',
        file_size: receiptPdfBuffer.length,
        source: 'generated',
      });

      // receipt evidence is appended in the single update above to avoid duplicate writes
    }

    return res.status(201).json({
      success: true,
      data: createdDocuments,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error uploading attachments:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const addOrderNote = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = noteRequestSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, status, evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(isUuid(branchId) ? 'branch_id' : 'tenant_id', isUuid(branchId) ? branchId : tenantId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const noteEntry: EvidenceEntry = {
      kind: 'event',
      id: randomUUID(),
      event_type: 'note',
      previous_status: order.status,
      new_status: order.status,
      note: body.note,
      actor_name: body.actorName ?? req.user?.email ?? req.user?.role ?? 'system',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('service_orders')
      .update({ evidence_metadata: appendEvidenceEntry((order as { evidence_metadata?: unknown }).evidence_metadata, noteEntry) })
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

    if (error) {
      return res.status(502).json({ error: 'Failed to persist order note', details: error.message });
    }

    const noteEventId = (noteEntry as { id: string }).id;
    await insertOrderEvent(supabase, {
      id: noteEventId,
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'note',
      previous_status: order.status,
      new_status: order.status,
      note: body.note,
      actor_name: body.actorName ?? req.user?.email ?? req.user?.role ?? 'system',
    });

    return res.status(201).json({ success: true, data: noteEntry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error adding note:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

  const body = statusRequestSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, status, evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(isUuid(branchId) ? 'branch_id' : 'tenant_id', isUuid(branchId) ? branchId : tenantId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const previousStatus = normalizeOrderStatus(order.status);
    const nextStatus = body.status;
    const allowedStatuses = await getAllowedOrderStatusKeys(tenantId);

    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ error: 'Invalid status', details: { allowedStatuses: [...allowedStatuses] } });
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status: nextStatus,
        received_at: nextStatus === 'recibido' ? new Date().toISOString() : undefined,
        completed_at: nextStatus === 'listo' ? new Date().toISOString() : undefined,
        delivered_at: nextStatus === 'entregado' ? new Date().toISOString() : undefined,
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update order status', details: error.message });
    }

    const statusEventId = randomUUID();
    await supabase
      .from('service_orders')
      .update({
        evidence_metadata: appendEvidenceEntry(data.evidence_metadata, {
          kind: 'event',
          id: statusEventId,
          event_type: 'status_changed',
          previous_status: previousStatus,
          new_status: nextStatus,
          note: body.note || null,
          actor_name: req.user?.email ?? req.user?.role ?? 'system',
          created_at: new Date().toISOString(),
        }),
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

    await insertOrderEvent(supabase, {
      id: statusEventId,
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'status_changed',
      previous_status: previousStatus,
      new_status: nextStatus,
      note: body.note || null,
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrderChecklist = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('service_order_checklists')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .maybeSingle();

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch order checklist', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting checklist:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateChecklistSchema = z.object({
  hasCharger: z.coerce.boolean().optional(),
  screenCondition: z.string().optional().or(z.literal('')),
  powersOn: z.coerce.boolean().optional(),
  backupRequired: z.coerce.boolean().optional(),
  notes: z.string().optional().or(z.literal('')),
});

export const updateOrderChecklist = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = updateChecklistSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase
      .from('service_orders')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to inspect order', details: existingError.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data, error } = await supabase
      .from('service_order_checklists')
      .upsert({
        tenant_id: tenantId,
        service_order_id: orderId,
        has_charger: body.hasCharger ?? false,
        screen_condition: body.screenCondition || null,
        powers_on: body.powersOn ?? false,
        backup_required: body.backupRequired ?? false,
        notes: body.notes || null,
      }, { onConflict: 'service_order_id' })
      .select('*')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to persist order checklist', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating checklist:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const warrantySchema = z.object({
  warrantyUntil: z.string().datetime().optional(),
  warrantyDays: z.coerce.number().int().positive().optional(),
  note: z.string().optional().or(z.literal('')),
});

export const updateOrderWarranty = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = warrantySchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, warranty_until, evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    let warrantyUntil = body.warrantyUntil ?? null;
    if (!warrantyUntil && body.warrantyDays) {
      const future = new Date();
      future.setDate(future.getDate() + body.warrantyDays);
      warrantyUntil = future.toISOString();
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update({ warranty_until: warrantyUntil })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update warranty', details: error.message });
    }

    const warrantyEventId = randomUUID();
    await insertOrderEvent(supabase, {
      id: warrantyEventId,
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'warranty_updated',
      previous_status: null,
      new_status: null,
      note: body.note || (warrantyUntil ? `Garantía hasta ${warrantyUntil}` : 'Garantía actualizada'),
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    await supabase
      .from('service_orders')
      .update({
        evidence_metadata: appendEvidenceEntry(order.evidence_metadata, {
          kind: 'event',
          id: warrantyEventId,
          event_type: 'warranty_updated',
          previous_status: null,
          new_status: null,
          note: body.note || (warrantyUntil ? `Garantía hasta ${warrantyUntil}` : 'Garantía actualizada'),
          actor_name: req.user?.email ?? req.user?.role ?? 'system',
          created_at: new Date().toISOString(),
        }),
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating warranty:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
