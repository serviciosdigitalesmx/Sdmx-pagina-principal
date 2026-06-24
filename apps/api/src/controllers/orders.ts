import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { getTenantClient, supabaseAdmin } from '@white-label/database';
import { loadTenantRuntimeConfig } from '../services/tenant-config';
import { getRequestIp } from '../lib/request-ip';
import { calculateOperationalRisk } from '../services/operational-risk';
import { sendTenantPushNotification } from '../services/pwa-push';
import { writeAuditLog } from '../services/security-backoffice';
import { cleanTenantTextField, getMissingRequiredTextField } from '../services/tenant-fields';
import { getEvidenceMetadata, type EvidenceEntry } from '../services/evidence-adapter';
import { FEATURE_EVIDENCE_MODE } from '../config/feature-flags';

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

const documentVisibilitySchema = z.object({
  isCustomerVisible: z.coerce.boolean(),
  retentionPolicyVersion: z.string().trim().optional().or(z.literal('')),
  retentionExpiresAt: z.union([z.string().datetime(), z.null(), z.literal('')]).optional(),
  note: z.string().trim().optional().or(z.literal('')),
});

const noteRequestSchema = z.object({
  note: z.string().min(1),
  actorName: z.string().optional(),
});

const statusRequestSchema = z.object({
  status: orderStatusSchema,
  note: z.string().optional(),
});

const financialUpdateSchema = z.object({
  estimatedCost: z.coerce.number().min(0).optional(),
  finalCost: z.coerce.number().min(0).optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  note: z.string().optional(),
});

const orderDetailsUpdateSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().min(7).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  deviceType: z.string().min(1).optional(),
  deviceModel: z.string().min(1).optional(),
  serialNumber: z.string().optional().or(z.literal('')),
  issue: z.string().min(1).optional(),
  promisedDate: z.string().optional().or(z.literal('')),
  metadata: z.record(z.unknown()).optional(),
});

const checklistPayloadSchema = z.object({
  hasCharger: z.coerce.boolean().default(false),
  screenCondition: z.string().optional().default(''),
  powersOn: z.coerce.boolean().default(false),
  backupRequired: z.coerce.boolean().default(false),
  notes: z.string().optional().default(''),
  cosmeticCondition: z.string().optional().default(''),
  reportedPhysicalDamage: z.string().optional().default(''),
  accessoriesReceived: z.string().optional().default(''),
  customerAcceptanceRequired: z.coerce.boolean().default(false),
  acceptedAt: z.string().datetime().optional().or(z.literal('')).default(''),
  acceptedByName: z.string().optional().default(''),
});

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
  is_customer_visible?: boolean | null;
  retention_policy_version?: string | null;
  retention_expires_at?: string | null;
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

type DeviceHistoryOrderRow = {
  id: string;
  tenant_id: string;
  folio: string;
  status: string;
  priority: string | null;
  customer_id: string | null;
  device_info: Record<string, unknown> | null;
  device_type: string | null;
  device_brand: string | null;
  device_model: string | null;
  serial_number: string | null;
  reported_issue: string | null;
  internal_diagnosis: string | null;
  estimated_cost: number | string | null;
  final_cost: number | string | null;
  promised_date: string | null;
  received_at: string | null;
  completed_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeviceHistoryStatusRow = {
  id: string;
  tenant_id: string;
  service_order_id: string;
  previous_status: string | null;
  new_status: string;
  comment: string | null;
  changed_by: string | null;
  created_at: string;
};

type DeviceHistoryDocumentRow = {
  id: string;
  tenant_id: string;
  service_order_id: string;
  file_name: string;
  file_type: string;
  mime_type: string | null;
  source: string;
  is_customer_visible: boolean | null;
  created_at: string;
};

type DeviceHistoryMovementRow = {
  id: string;
  tenant_id: string;
  service_order_id: string | null;
  product_id: string;
  movement_type: string;
  quantity: number | string;
  unit_cost: number | string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

type WarrantyClaimRow = {
  id: string;
  tenant_id: string;
  original_order_id: string;
  claim_order_id: string | null;
  warranty_until: string | null;
  eligibility_status: string;
  status: string;
  coverage_scope: string;
  claim_reason: string;
  reported_issue: string | null;
  requested_resolution: string | null;
  resolution_notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  rejected_by: string | null;
  resolved_by: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  resolved_at: string | null;
  cancelled_at: string | null;
};

type WarrantyOrderRow = {
  id: string;
  tenant_id: string;
  status: string | null;
  serial_number: string | null;
  warranty_until: string | null;
};


const createPaymentSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  paymentMethod: z.string().min(1, 'El método de pago es requerido'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});


const refundPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  reason: z.string().trim().min(3),
  reference: z.string().trim().optional().or(z.literal('')),
});

const warrantyClaimSchema = z.object({
  claimOrderId: z.string().uuid().optional().nullable(),
  claimReason: z.string().trim().min(1),
  reportedIssue: z.string().trim().optional().or(z.literal('')),
  requestedResolution: z.string().trim().optional().or(z.literal('')),
  coverageScope: z.enum(['full', 'labor', 'parts', 'diagnosis', 'other']).default('full'),
});

const warrantyClaimStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected', 'resolved', 'cancelled']),
  resolutionNotes: z.string().trim().optional().or(z.literal('')),
});

type OrderChecklistPayload = {
  hasCharger?: boolean;
  screenCondition?: string;
  powersOn?: boolean;
  backupRequired?: boolean;
  notes?: string;
  cosmeticCondition?: string;
  reportedPhysicalDamage?: string;
  accessoriesReceived?: string;
  customerAcceptanceRequired?: boolean;
  acceptedAt?: string;
  acceptedByName?: string;
};

type OrderChecklistDbPatch = {
  tenant_id: string;
  service_order_id: string;
  has_charger: boolean;
  screen_condition: string | null;
  powers_on: boolean;
  backup_required: boolean;
  notes: string | null;
  cosmetic_condition: string | null;
  reported_physical_damage: string | null;
  accessories_received: string | null;
  customer_acceptance_required: boolean;
  accepted_at: string | null;
  accepted_by_name: string | null;
};

type OrderChecklistRow = OrderChecklistDbPatch & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function getRequestScope(req: Request) {
  return req.scope ?? null;
}

function getScopedBranchId(req: Request) {
  const scope = getRequestScope(req);
  if (scope?.mode === 'branch' && isUuid(scope.sucursalId)) {
    return scope.sucursalId;
  }

  return null;
}

function applyOrderAccessScope(query: any, req: Request) {
  let scopedQuery = query;
  const branchId = getScopedBranchId(req);
  if (branchId) {
    scopedQuery = scopedQuery.eq('sucursal_id', branchId);
  }

  if (req.user?.role === 'technician' && req.user.userId) {
    scopedQuery = scopedQuery.eq('assigned_user_id', req.user.userId);
  }

  return scopedQuery;
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
  serialNumber: z.string().optional().or(z.literal('')),
  issue: z.string().min(1, 'La falla es requerida'),
  quoteFolio: z.string().optional(),
  estimatedCost: z.coerce.number().min(0).default(0),
  promisedDate: z.string().optional().or(z.literal('')),
  includeIva: z.coerce.boolean().default(false),
  checklist: checklistPayloadSchema.default({
    hasCharger: false,
    screenCondition: '',
    powersOn: false,
    backupRequired: false,
    notes: '',
    cosmeticCondition: '',
    reportedPhysicalDamage: '',
    accessoriesReceived: '',
    customerAcceptanceRequired: false,
    acceptedAt: '',
    acceptedByName: '',
  }),
  receiptUrl: z.string().optional().or(z.literal('')),
  sucursalId: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

function normalizeOrderStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('diag')) return 'diagnostico';
  if (value.includes('refaccion')) return 'en_espera_de_refaccion';
  if (value.includes('cotiz')) return 'cotizado';
  if (value.includes('repar')) return 'reparacion';
  if (value.includes('listo') && value.includes('entrega')) return 'listo_para_entrega';
  if (value.includes('list')) return 'listo';
  if (value.includes('entreg')) return 'entregado';
  return 'recibido';
}

const CHECKLIST_FIELD_TO_PAYLOAD_KEY = {
  has_charger: 'hasCharger',
  screen_condition: 'screenCondition',
  powers_on: 'powersOn',
  backup_required: 'backupRequired',
  notes: 'notes',
  cosmetic_condition: 'cosmeticCondition',
  reported_physical_damage: 'reportedPhysicalDamage',
  accessories_received: 'accessoriesReceived',
  customer_acceptance_required: 'customerAcceptanceRequired',
  accepted_at: 'acceptedAt',
  accepted_by_name: 'acceptedByName',
} as const;

const CHECKLIST_FIELD_KEYS = new Set(Object.keys(CHECKLIST_FIELD_TO_PAYLOAD_KEY));

function cleanText(value: unknown) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
}

function normalizeAcceptedAt(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function buildChecklistPatch(tenantId: string, orderId: string, payload: OrderChecklistPayload, existing?: Partial<OrderChecklistRow> | null): OrderChecklistDbPatch {
  return {
    tenant_id: tenantId,
    service_order_id: orderId,
    has_charger: payload.hasCharger ?? existing?.has_charger ?? false,
    screen_condition: cleanText(payload.screenCondition ?? existing?.screen_condition),
    powers_on: payload.powersOn ?? existing?.powers_on ?? false,
    backup_required: payload.backupRequired ?? existing?.backup_required ?? false,
    notes: cleanText(payload.notes ?? existing?.notes),
    cosmetic_condition: cleanText(payload.cosmeticCondition ?? existing?.cosmetic_condition),
    reported_physical_damage: cleanText(payload.reportedPhysicalDamage ?? existing?.reported_physical_damage),
    accessories_received: cleanText(payload.accessoriesReceived ?? existing?.accessories_received),
    customer_acceptance_required: payload.customerAcceptanceRequired ?? existing?.customer_acceptance_required ?? false,
    accepted_at: normalizeAcceptedAt(payload.acceptedAt ?? existing?.accepted_at),
    accepted_by_name: cleanText(payload.acceptedByName ?? existing?.accepted_by_name),
  };
}

function normalizeChecklistRow(row: Partial<OrderChecklistRow> | null | undefined) {
  if (!row) return null;
  return {
    ...row,
    has_charger: Boolean(row.has_charger),
    screen_condition: row.screen_condition ?? null,
    powers_on: Boolean(row.powers_on),
    backup_required: Boolean(row.backup_required),
    notes: row.notes ?? null,
    cosmetic_condition: row.cosmetic_condition ?? null,
    reported_physical_damage: row.reported_physical_damage ?? null,
    accessories_received: row.accessories_received ?? null,
    customer_acceptance_required: Boolean(row.customer_acceptance_required),
    accepted_at: row.accepted_at ?? null,
    accepted_by_name: row.accepted_by_name ?? null,
  };
}

async function getRequiredChecklistFields(tenantId: string) {
  const runtimeConfig = await loadTenantRuntimeConfig(tenantId);
  return runtimeConfig.fieldDefinitions
    .filter((field) => field.entity === 'service_order_checklists' && field.required && field.visible !== false && CHECKLIST_FIELD_KEYS.has(field.field_key))
    .map((field) => field.field_key);
}

function getMissingRequiredChecklistFields(requiredFields: string[], checklist: Partial<OrderChecklistRow>) {
  return requiredFields.filter((fieldKey) => {
    const value = checklist[fieldKey as keyof OrderChecklistRow];
    if (typeof value === 'boolean') {
      return false;
    }
    return cleanText(value) === null;
  });
}

async function validateRequiredChecklist(tenantId: string, checklist: Partial<OrderChecklistRow>) {
  const requiredFields = await getRequiredChecklistFields(tenantId);
  return getMissingRequiredChecklistFields(requiredFields, checklist);
}

async function auditChecklistChange(req: Request, tenantId: string, action: string, before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  try {
    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action,
      ipAddress: getRequestIp(req.headers, req.ip),
      userAgent: req.get('user-agent') ?? null,
      dataBefore: before,
      dataAfter: after,
    });
  } catch (error) {
    console.error('Failed to write checklist audit log:', error);
  }
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

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function requestIdFrom(req: Request) {
  return String(req.headers['x-request-id'] ?? req.headers['x-correlation-id'] ?? randomUUID());
}

function normalizeWarrantyClaim(row: WarrantyClaimRow) {
  return {
    id: row.id,
    originalOrderId: row.original_order_id,
    claimOrderId: row.claim_order_id,
    warrantyUntil: row.warranty_until,
    eligibilityStatus: row.eligibility_status,
    status: row.status,
    coverageScope: row.coverage_scope,
    claimReason: row.claim_reason,
    reportedIssue: row.reported_issue,
    requestedResolution: row.requested_resolution,
    resolutionNotes: row.resolution_notes,
    createdBy: row.created_by,
    approvedBy: row.approved_by,
    rejectedBy: row.rejected_by,
    resolvedBy: row.resolved_by,
    cancelledBy: row.cancelled_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    resolvedAt: row.resolved_at,
    cancelledAt: row.cancelled_at,
  };
}

function normalizeDeviceHistoryTimeline(rows: DeviceHistoryStatusRow[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    id: row.id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    comment: row.comment,
    changedBy: row.changed_by,
    createdAt: row.created_at,
  }));
}

function normalizeDeviceHistoryEvents(rows: OrderEventRow[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    id: row.id,
    eventType: row.event_type,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    note: row.note,
    actorName: row.actor_name,
    createdAt: row.created_at,
  }));
}

function normalizeDeviceHistoryDocuments(rows: DeviceHistoryDocumentRow[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    id: row.id,
    fileName: row.file_name,
    fileType: row.file_type,
    mimeType: row.mime_type ?? null,
    source: row.source,
    isCustomerVisible: Boolean(row.is_customer_visible),
    createdAt: row.created_at,
  }));
}

function normalizeDeviceHistoryMovements(rows: DeviceHistoryMovementRow[] | null | undefined) {
  return (rows ?? []).map((row) => ({
    id: row.id,
    productId: row.product_id,
    movementType: row.movement_type,
    quantity: toNumber(row.quantity),
    unitCost: toNumber(row.unit_cost),
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
  }));
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
  is_customer_visible?: boolean;
  retention_policy_version?: string | null;
  retention_expires_at?: string | null;
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
    return { name: 'FIXI', branding: null };
  }

  return {
    name: String(data.name ?? 'FIXI'),
    branding: (data.branding as TenantBranding | null) ?? null,
  };
}

async function getTenantOperationalStatuses(tenantId: string) {
  const config = await loadTenantRuntimeConfig(tenantId);
  const statuses = config.statusOptions.service_orders ?? [];
  if (statuses.length > 0) {
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
  doc.fillColor('#ffffff').fontSize(20).text(options.tenantName || 'FIXI', 58, 58, { width: 340 });
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
  doc.fontSize(10).fillColor('#6b7280').text(`Documento generado automáticamente por ${options.tenantName || 'FIXI'}.`);
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

    const scope = getRequestScope(req);
    const scopeSucursalId = scope?.sucursalId ?? null;
    const requestedSucursalId = isUuid(validatedData.sucursalId)
      ? validatedData.sucursalId
      : isUuid(scopeSucursalId)
        ? scopeSucursalId
        : null;

    if (scope?.role === 'manager' && isUuid(scopeSucursalId) && requestedSucursalId && requestedSucursalId !== scopeSucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const folioPrefix = process.env.ORDER_FOLIO_PREFIX ?? 'ORD';
    const newFolio = `${folioPrefix}-${Date.now().toString(36).toUpperCase()}`;
    const runtimeConfig = await loadTenantRuntimeConfig(tenantId);
    const serialNumber = cleanTenantTextField(validatedData.serialNumber);
    const missingSerialField = getMissingRequiredTextField(runtimeConfig, 'service_orders', 'serial_number', serialNumber);

    if (missingSerialField) {
      return res.status(400).json({
        error: 'Required device field is missing',
        details: { entity: 'service_orders', fields: [missingSerialField] },
      });
    }

    const estimatedCost = Number.isFinite(validatedData.estimatedCost) ? validatedData.estimatedCost : 0;
    const ivaAmount = validatedData.includeIva ? Number((estimatedCost * 0.16).toFixed(2)) : 0;
    const finalCost = Number((estimatedCost + ivaAmount).toFixed(2));
    const checklistPatch = buildChecklistPatch(tenantId, '__pending_order__', validatedData.checklist);
    const missingChecklistFields = await validateRequiredChecklist(tenantId, checklistPatch);

    if (missingChecklistFields.length > 0) {
      return res.status(400).json({
        error: 'Required intake checklist fields are missing',
        details: { entity: 'service_order_checklists', fields: missingChecklistFields },
      });
    }

    // Resolve Customer ID
    let customerId: string | null = null;
    let customerQuery = supabase
      .from('customers')
      .select('id, name, full_name, phone')
      .eq('tenant_id', tenantId);

    if (validatedData.clientPhone) {
      customerQuery = customerQuery.eq('phone', validatedData.clientPhone);
    } else {
      customerQuery = customerQuery.or(`name.ilike.${validatedData.clientName},full_name.ilike.${validatedData.clientName}`);
    }

    const { data: existingCustomers } = await customerQuery.limit(1);

    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      const { data: newCustomer, error: createCustError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          name: validatedData.clientName || 'Cliente Sin Nombre',
          full_name: validatedData.clientName || 'Cliente Sin Nombre',
          phone: validatedData.clientPhone || null,
          email: validatedData.clientEmail || null,
          tag: 'nuevo'
        })
        .select('id')
        .single();
      
      if (!createCustError && newCustomer) {
        customerId = newCustomer.id;
      }
    }

    const { data, error } = await supabase
      .from('service_orders')
      .insert([
        {
          tenant_id: tenantId,
          sucursal_id: requestedSucursalId,
          customer_id: customerId,
          folio: newFolio,
          public_token: randomUUID(),
          status: 'recibido',
          device_info: {
            brand: validatedData.deviceModel,
            model: validatedData.deviceModel,
            type: validatedData.deviceType,
            serial_number: serialNumber,
            customer_name: validatedData.clientName,
            customer_phone: validatedData.clientPhone,
            customer_email: validatedData.clientEmail || null,
          },
          serial_number: serialNumber,
          problem_description: validatedData.issue,
          metadata: validatedData.metadata ?? {},
          estimated_cost: estimatedCost,
          final_cost: finalCost,
          promised_date: validatedData.promisedDate || null,
          receipt_url: validatedData.receiptUrl || null,
          assigned_user_id: req.user?.role === 'technician' ? req.user.userId ?? null : null,
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

    const checklist = {
      ...checklistPatch,
      service_order_id: data.id,
    };

    const { data: checklistData, error: checklistError } = await supabase
      .from('service_order_checklists')
      .insert([checklist])
      .select('*')
      .single();

    if (checklistError) {
      console.error('Supabase checklist insert error:', checklistError.message);
      return res.status(502).json({
        error: 'Failed to persist order checklist',
        details: checklistError.message,
      });
    }

    await auditChecklistChange(req, tenantId, 'orders.checklist_created', null, normalizeChecklistRow(checklistData) as Record<string, unknown>);

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

    if (data.assigned_user_id) {
      void sendTenantPushNotification(tenantId, {
        type: 'order.assigned',
        title: 'Nueva orden asignada',
        body: `Se asignó la orden ${newFolio} para seguimiento.`,
        data: {
          orderId: data.id,
          folio: newFolio,
          tenantId,
          assignedUserId: data.assigned_user_id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        ...data,
        final_cost: finalCost,
        estimated_cost: estimatedCost,
        receipt_url: validatedData.receiptUrl || null,
        sucursal_id: requestedSucursalId,
        public_token: data.public_token,
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
        include_iva: validatedData.includeIva,
        checklist: normalizeChecklistRow(checklistData),
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
    const scope = getRequestScope(req);

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    let query = supabase
      .from('service_orders')
      .select('*, service_order_checklists(*), customers(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

    query = applyOrderAccessScope(query, req);

    const { data, error } = await query;

    if (error) {
      return res.status(502).json({
        error: 'Failed to fetch orders',
        details: error.message,
      });
    }

    const runtimeConfig = await loadTenantRuntimeConfig(tenantId);
    const enrichedData = (data ?? []).map((order) => ({
      ...order,
      operational_risk: calculateOperationalRisk({ order, runtimeConfig }),
    }));

    return res.status(200).json({
      success: true,
      data: enrichedData,
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
    const scope = getRequestScope(req);

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const supabase = getTenantClient(tenantId);
    let orderQuery = supabase
      .from('service_orders')
      .select('*, customers(*)')
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

    orderQuery = applyOrderAccessScope(orderQuery, req);

    const [orderResult, checklistResult, documentsResult, eventsResult, paymentsResult, runtimeConfig] = await Promise.all([
      orderQuery.select('*, metadata').single(),
      supabase
        .from('service_order_checklists')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .maybeSingle(),
      supabase
        .from('service_order_documents')
        .select('id, tenant_id, service_order_id, bucket_name, storage_path, public_url, file_name, file_type, mime_type, file_size, source, is_customer_visible, retention_policy_version, retention_expires_at, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true }),
      supabase
        .from('service_order_events')
        .select('id, tenant_id, service_order_id, event_type, previous_status, new_status, note, actor_name, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true }),
      supabase
        .from('customer_payments')
        .select('id, amount, payment_method, reference, notes, paid_at, created_by, source')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('paid_at', { ascending: false }),
      loadTenantRuntimeConfig(tenantId),
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

    const evidenceMetadata = await getEvidenceMetadata(orderId, FEATURE_EVIDENCE_MODE);
    const documents = normalizeOrderDocuments(documentsResult.data ?? [], evidenceMetadata ?? []);
    const events = normalizeOrderEvents(eventsResult.data ?? [], evidenceMetadata ?? []);
    const operationalRisk = calculateOperationalRisk({
      order: orderResult.data,
      runtimeConfig,
      statusEvents: events
        .filter((event) => event.event_type === 'status_changed')
        .map((event) => ({
          created_at: event.created_at,
          new_status: event.new_status,
        })),
    });
    const pdfAttachment = buildPdfAttachment(
      orderResult.data.receipt_url || documents.find((document) => document.file_type === 'receipt_pdf' && document.public_url)?.public_url || null
    );

    if (paymentsResult.error) {
      console.error('Failed to fetch order payments:', paymentsResult.error);
    }

    const validPayments = paymentsResult.data || [];
    const totalCobrado = validPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const finalCost = Number(orderResult.data.final_cost) > 0 ? Number(orderResult.data.final_cost) : Number(orderResult.data.estimated_cost || 0);
    const saldoPendiente = Math.max(0, finalCost - totalCobrado);

    return res.json({
      success: true,
      data: {
        order: {
          ...orderResult.data,
          operational_risk: operationalRisk,
        },
        operational_risk: operationalRisk,
        documents,
        events,
        checklist: normalizeChecklistRow(checklistResult.data as Partial<OrderChecklistRow> | null),
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
        financialSummary: {
          total_aplicable: finalCost,
          total_cobrado: totalCobrado,
          saldo_pendiente: saldoPendiente,
        },
        payments: validPayments,
      },
    });
  } catch (error) {
    console.error('Error getting order by id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getDeviceHistoryBySerial = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const parsed = z.object({
      serialNumber: z.string().trim().min(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }).safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid serialNumber or limit',
        details: parsed.error.errors,
      });
    }

    const serialNumber = cleanTenantTextField(parsed.data.serialNumber) ?? '';
    const normalizedSerialNumber = serialNumber.toLowerCase();

    const { data: historyRows, error: historyError } = await supabaseAdmin.rpc('find_device_history_by_serial', {
      p_tenant_id: tenantId,
      p_serial_number: serialNumber,
      p_limit: parsed.data.limit,
    });

    if (historyError) {
      return res.status(502).json({
        error: 'Failed to fetch device history',
        details: historyError.message,
      });
    }

    const orders = (historyRows ?? []) as DeviceHistoryOrderRow[];
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          serialNumber,
          normalizedSerialNumber,
          totalOrders: 0,
          orders: [],
        },
      });
    }

    const orderIds = orders.map((order) => order.id);
    const [statusHistoryResult, eventsResult, documentsResult, movementsResult] = await Promise.all([
      supabaseAdmin
        .from('service_order_status_history')
        .select('id, tenant_id, service_order_id, previous_status, new_status, comment, changed_by, created_at')
        .eq('tenant_id', tenantId)
        .in('service_order_id', orderIds)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('service_order_events')
        .select('id, tenant_id, service_order_id, event_type, previous_status, new_status, note, actor_name, created_at')
        .eq('tenant_id', tenantId)
        .in('service_order_id', orderIds)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('service_order_documents')
        .select('id, tenant_id, service_order_id, file_name, file_type, mime_type, source, is_customer_visible, created_at')
        .eq('tenant_id', tenantId)
        .in('service_order_id', orderIds)
        .order('created_at', { ascending: true }),
      supabaseAdmin
        .from('inventory_movements')
        .select('id, tenant_id, service_order_id, product_id, movement_type, quantity, unit_cost, reference, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('movement_type', 'service_order_consumed')
        .in('service_order_id', orderIds)
        .order('created_at', { ascending: true }),
    ]);

    if (statusHistoryResult.error) {
      return res.status(502).json({
        error: 'Failed to fetch status history',
        details: statusHistoryResult.error.message,
      });
    }

    if (eventsResult.error) {
      return res.status(502).json({
        error: 'Failed to fetch order events',
        details: eventsResult.error.message,
      });
    }

    if (documentsResult.error) {
      return res.status(502).json({
        error: 'Failed to fetch order documents',
        details: documentsResult.error.message,
      });
    }

    if (movementsResult.error) {
      return res.status(502).json({
        error: 'Failed to fetch inventory movements',
        details: movementsResult.error.message,
      });
    }

    const statusByOrder = new Map<string, ReturnType<typeof normalizeDeviceHistoryTimeline>>();
    for (const row of (statusHistoryResult.data ?? []) as DeviceHistoryStatusRow[]) {
      const list = statusByOrder.get(row.service_order_id) ?? [];
      list.push({
        id: row.id,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        comment: row.comment,
        changedBy: row.changed_by,
        createdAt: row.created_at,
      });
      statusByOrder.set(row.service_order_id, list);
    }

    const eventsByOrder = new Map<string, ReturnType<typeof normalizeDeviceHistoryEvents>>();
    for (const row of (eventsResult.data ?? []) as OrderEventRow[]) {
      const list = eventsByOrder.get(row.service_order_id) ?? [];
      list.push({
        id: row.id,
        eventType: row.event_type,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        note: row.note,
        actorName: row.actor_name,
        createdAt: row.created_at,
      });
      eventsByOrder.set(row.service_order_id, list);
    }

    const documentsByOrder = new Map<string, ReturnType<typeof normalizeDeviceHistoryDocuments>>();
    for (const row of (documentsResult.data ?? []) as DeviceHistoryDocumentRow[]) {
      const list = documentsByOrder.get(row.service_order_id) ?? [];
      list.push({
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        mimeType: row.mime_type ?? null,
        source: row.source,
        isCustomerVisible: Boolean(row.is_customer_visible),
        createdAt: row.created_at,
      });
      documentsByOrder.set(row.service_order_id, list);
    }

    const movementsByOrder = new Map<string, ReturnType<typeof normalizeDeviceHistoryMovements>>();
    for (const row of (movementsResult.data ?? []) as DeviceHistoryMovementRow[]) {
      if (!row.service_order_id) {
        continue;
      }
      const list = movementsByOrder.get(row.service_order_id) ?? [];
      list.push({
        id: row.id,
        productId: row.product_id,
        movementType: row.movement_type,
        quantity: toNumber(row.quantity),
        unitCost: toNumber(row.unit_cost),
        reference: row.reference,
        notes: row.notes,
        createdAt: row.created_at,
      });
      movementsByOrder.set(row.service_order_id, list);
    }

    const normalizedOrders = orders.map((order) => {
      const device = order.device_info ?? {};
      const safeDocuments = documentsByOrder.get(order.id) ?? [];
      const customerVisibleCount = safeDocuments.filter((document) => document.isCustomerVisible).length;

      return {
        id: order.id,
        folio: order.folio,
        status: order.status,
        priority: order.priority ?? null,
        customerId: order.customer_id,
        device: {
          type: String((device as { type?: string | null }).type ?? order.device_type ?? ''),
          brand: String((device as { brand?: string | null }).brand ?? order.device_brand ?? ''),
          model: String((device as { model?: string | null }).model ?? order.device_model ?? ''),
          serialNumber: String((device as { serial_number?: string | null }).serial_number ?? order.serial_number ?? ''),
        },
        reportedIssue: order.reported_issue,
        internalDiagnosis: order.internal_diagnosis,
        costs: {
          estimated: toNumber(order.estimated_cost),
          final: toNumber(order.final_cost),
        },
        dates: {
          receivedAt: order.received_at,
          promisedDate: order.promised_date,
          completedAt: order.completed_at,
          deliveredAt: order.delivered_at,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
        },
        timeline: {
          statusHistory: statusByOrder.get(order.id) ?? [],
          events: eventsByOrder.get(order.id) ?? [],
        },
        documents: {
          total: safeDocuments.length,
          customerVisible: customerVisibleCount,
          items: safeDocuments,
        },
        inventory: {
          consumedItems: movementsByOrder.get(order.id) ?? [],
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        serialNumber,
        normalizedSerialNumber,
        totalOrders: normalizedOrders.length,
        orders: normalizedOrders,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid serialNumber or limit',
        details: error.errors,
      });
    }
    console.error('Error getting device history:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const uploadOrderAttachments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const scope = getRequestScope(req);

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
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
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
        is_customer_visible: false,
        retention_policy_version: null,
        retention_expires_at: null,
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
        is_customer_visible: false,
        retention_policy_version: null,
        retention_expires_at: null,
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
        is_customer_visible: false,
        retention_policy_version: null,
        retention_expires_at: null,
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
        is_customer_visible: false,
        retention_policy_version: null,
        retention_expires_at: null,
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


export const updateOrderDocumentVisibility = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const documentId = req.params.documentId;
    const scope = getRequestScope(req);

    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (!orderId) return res.status(400).json({ error: 'Order id is required' });
    if (!documentId) return res.status(400).json({ error: 'Document id is required' });

    const body = documentVisibilitySchema.parse(req.body);
    const retentionExpiresAt = body.retentionExpiresAt === '' ? null : body.retentionExpiresAt ?? null;
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, tenant_id, sucursal_id')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const { data, error } = await supabase
      .from('service_order_documents')
      .update({
        is_customer_visible: body.isCustomerVisible,
        retention_policy_version: body.retentionPolicyVersion || null,
        retention_expires_at: retentionExpiresAt,
      })
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .eq('id', documentId)
      .select('id, tenant_id, service_order_id, bucket_name, storage_path, public_url, file_name, file_type, mime_type, file_size, source, is_customer_visible, retention_policy_version, retention_expires_at, created_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update document visibility', details: error.message });
    }

    await insertOrderEvent(supabase, {
      id: randomUUID(),
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'document_visibility_updated',
      previous_status: null,
      new_status: null,
      note: body.note || `Documento ${body.isCustomerVisible ? 'visible' : 'privado'} para cliente`,
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error updating document visibility:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const addOrderNote = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const scope = getRequestScope(req);

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
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
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

    void sendTenantPushNotification(tenantId, {
      type: 'order.message',
      title: 'Nuevo mensaje técnico',
      body: body.note,
      data: {
        orderId,
        tenantId,
        eventType: 'note',
      },
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

export const addOrderMessage = addOrderNote;

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const scope = getRequestScope(req);

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
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
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

    if (normalizeOrderStatus(nextStatus) === 'recibido') {
      const { data: checklist, error: checklistError } = await supabase
        .from('service_order_checklists')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .maybeSingle();

      if (checklistError) {
        return res.status(502).json({ error: 'Failed to inspect order checklist', details: checklistError.message });
      }

      const missingChecklistFields = await validateRequiredChecklist(tenantId, (checklist ?? {}) as Partial<OrderChecklistRow>);
      if (missingChecklistFields.length > 0) {
        return res.status(400).json({
          error: 'Required intake checklist fields are missing',
          details: { entity: 'service_order_checklists', fields: missingChecklistFields },
        });
      }
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update({
        status: nextStatus,
        received_at: nextStatus === 'recibido' ? new Date().toISOString() : undefined,
        completed_at: nextStatus === 'listo' ? new Date().toISOString() : undefined,
        delivered_at: nextStatus === 'entregado' ? new Date().toISOString() : undefined,
        updated_by: req.user?.userId ?? null,
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

    void sendTenantPushNotification(tenantId, {
      type: 'order.status_changed',
      title: 'Cambio de estado',
      body: `La orden ${orderId} cambió a ${nextStatus}.`,
      data: {
        orderId,
        tenantId,
        previousStatus,
        nextStatus,
      },
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

export const updateOrderFinancials = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const scope = getRequestScope(req);

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = financialUpdateSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, estimated_cost, final_cost, evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const nextEstimatedCost = typeof body.estimatedCost === 'number' ? body.estimatedCost : Number(order.estimated_cost ?? 0);
    const nextFinalCost = typeof body.finalCost === 'number' ? body.finalCost : Number(order.final_cost ?? nextEstimatedCost);

    const { data, error } = await supabase
      .from('service_orders')
      .update({
        estimated_cost: nextEstimatedCost,
        final_cost: nextFinalCost,
        receipt_url: body.receiptUrl || undefined,
        updated_by: req.user?.userId ?? null,
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update order financials', details: error.message });
    }

    const noteEntry = body.note?.trim()
      ? {
          kind: 'event' as const,
          id: randomUUID(),
          event_type: 'financials_updated',
          previous_status: null,
          new_status: null,
          note: body.note.trim(),
          actor_name: req.user?.email ?? req.user?.role ?? 'system',
          created_at: new Date().toISOString(),
        }
      : null;

    if (noteEntry) {
      const { error: metadataError } = await supabase
        .from('service_orders')
        .update({
          evidence_metadata: appendEvidenceEntry((order as { evidence_metadata?: unknown }).evidence_metadata, noteEntry),
        })
        .eq('tenant_id', tenantId)
        .eq('id', orderId);

      if (metadataError) {
        return res.status(502).json({ error: 'Failed to persist financial note', details: metadataError.message });
      }

      await insertOrderEvent(supabase, {
        id: noteEntry.id,
        tenant_id: tenantId,
        service_order_id: orderId,
        event_type: noteEntry.event_type,
        previous_status: null,
        new_status: null,
        note: noteEntry.note,
        actor_name: noteEntry.actor_name,
      });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating order financials:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateOrderDetails = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const scope = getRequestScope(req);

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = orderDetailsUpdateSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase
      .from('service_orders')
      .select('id, device_info')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
      .single();

    if (existingError || !existing) {
      return res.status(404).json({ error: 'Order not found', details: existingError?.message ?? 'Not found' });
    }

    const currentDeviceInfo = (existing.device_info as Record<string, unknown> | null) ?? {};
    const nextDeviceInfo = {
      ...currentDeviceInfo,
      customer_name: body.clientName ?? String(currentDeviceInfo.customer_name ?? ''),
      customer_phone: body.clientPhone ?? String(currentDeviceInfo.customer_phone ?? ''),
      customer_email: body.clientEmail === undefined ? currentDeviceInfo.customer_email ?? null : body.clientEmail || null,
      type: body.deviceType ?? String(currentDeviceInfo.type ?? ''),
      brand: body.deviceModel ?? String(currentDeviceInfo.brand ?? ''),
      model: body.deviceModel ?? String(currentDeviceInfo.model ?? ''),
      serial_number: body.serialNumber === undefined ? currentDeviceInfo.serial_number ?? null : cleanTenantTextField(body.serialNumber),
    };

    let customerId: string | undefined = undefined;
    if (body.clientPhone || body.clientName) {
      let customerQuery = supabase
        .from('customers')
        .select('id, name, full_name, phone')
        .eq('tenant_id', tenantId);

      const phoneToSearch = body.clientPhone ?? String(currentDeviceInfo.customer_phone ?? '');
      const nameToSearch = body.clientName ?? String(currentDeviceInfo.customer_name ?? '');

      if (phoneToSearch) {
        customerQuery = customerQuery.eq('phone', phoneToSearch);
      } else {
        customerQuery = customerQuery.or(`name.ilike.${nameToSearch},full_name.ilike.${nameToSearch}`);
      }

      const { data: existingCustomers } = await customerQuery.limit(1);

      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id;
      } else {
        const { data: newCustomer, error: createCustError } = await supabase
          .from('customers')
          .insert({
            tenant_id: tenantId,
            name: nameToSearch || 'Cliente Sin Nombre',
            full_name: nameToSearch || 'Cliente Sin Nombre',
            phone: phoneToSearch || null,
            email: nextDeviceInfo.customer_email || null,
            tag: 'actualizado'
          })
          .select('id')
          .single();
        
        if (!createCustError && newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    const { data, error } = await supabase
      .from('service_orders')
      .update({
        device_info: nextDeviceInfo,
        device_type: body.deviceType ?? undefined,
        device_model: body.deviceModel ?? undefined,
        serial_number: body.serialNumber === undefined ? undefined : cleanTenantTextField(body.serialNumber),
        problem_description: body.issue ?? undefined,
        promised_date: body.promisedDate === '' ? null : body.promisedDate,
        metadata: body.metadata ?? undefined,
        updated_by: req.user?.userId ?? null,
        ...(customerId !== undefined ? { customer_id: customerId } : {}),
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update order details', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating order details:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrderChecklist = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      return res.status(502).json({ error: 'Failed to inspect order', details: orderError.message });
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data, error } = await supabase
      .from('service_order_checklists')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .maybeSingle();

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch order checklist', details: error.message });
    }

    return res.json({
      success: true,
      data: normalizeChecklistRow(data as Partial<OrderChecklistRow> | null) ?? normalizeChecklistRow(buildChecklistPatch(tenantId, orderId, {})),
    });
  } catch (error) {
    console.error('Error getting checklist:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateChecklistSchema = checklistPayloadSchema.partial().extend({
  hasCharger: z.coerce.boolean().optional(),
  screenCondition: z.string().optional().or(z.literal('')),
  powersOn: z.coerce.boolean().optional(),
  backupRequired: z.coerce.boolean().optional(),
  notes: z.string().optional().or(z.literal('')),
  cosmeticCondition: z.string().optional().or(z.literal('')),
  reportedPhysicalDamage: z.string().optional().or(z.literal('')),
  accessoriesReceived: z.string().optional().or(z.literal('')),
  customerAcceptanceRequired: z.coerce.boolean().optional(),
  acceptedAt: z.string().datetime().optional().or(z.literal('')),
  acceptedByName: z.string().optional().or(z.literal('')),
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

    const { data: currentChecklist, error: currentChecklistError } = await supabase
      .from('service_order_checklists')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .maybeSingle();

    if (currentChecklistError) {
      return res.status(502).json({ error: 'Failed to inspect order checklist', details: currentChecklistError.message });
    }

    const checklistPatch = buildChecklistPatch(tenantId, orderId, body, currentChecklist as Partial<OrderChecklistRow> | null);
    const missingChecklistFields = await validateRequiredChecklist(tenantId, checklistPatch);

    if (missingChecklistFields.length > 0) {
      return res.status(400).json({
        error: 'Required intake checklist fields are missing',
        details: { entity: 'service_order_checklists', fields: missingChecklistFields },
      });
    }

    const { data, error } = await supabase
      .from('service_order_checklists')
      .upsert(checklistPatch, { onConflict: 'service_order_id' })
      .select('*')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to persist order checklist', details: error.message });
    }

    const normalized = normalizeChecklistRow(data as Partial<OrderChecklistRow>);
    await auditChecklistChange(
      req,
      tenantId,
      currentChecklist ? 'orders.checklist_updated' : 'orders.checklist_created',
      normalizeChecklistRow(currentChecklist as Partial<OrderChecklistRow> | null) as Record<string, unknown> | null,
      normalized as Record<string, unknown>,
    );

    return res.json({ success: true, data: normalized });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating checklist:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getOrderWarrantySummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const orderResult = await supabaseAdmin
      .from('service_orders')
      .select('id, tenant_id, status, serial_number, warranty_until')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .maybeSingle();

    if (orderResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order', details: orderResult.error.message });
    }

    if (!orderResult.data) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.data as WarrantyOrderRow;
    const [claimsResult, documentsResult, movementsResult, historyResult] = await Promise.all([
      supabaseAdmin
        .from('service_order_warranties')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`original_order_id.eq.${orderId},claim_order_id.eq.${orderId}`)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('service_order_documents')
        .select('id, tenant_id, service_order_id, file_name, file_type, mime_type, source, is_customer_visible, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('inventory_movements')
        .select('id, tenant_id, service_order_id, product_id, movement_type, quantity, unit_cost, reference, notes, created_at')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .eq('movement_type', 'service_order_consumed')
        .order('created_at', { ascending: true }),
      order.serial_number
        ? supabaseAdmin.rpc('find_device_history_by_serial', {
          p_tenant_id: tenantId,
          p_serial_number: order.serial_number,
          p_limit: 100,
        })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (claimsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch warranty claims', details: claimsResult.error.message });
    }

    if (documentsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch warranty documents', details: documentsResult.error.message });
    }

    if (movementsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch consumed inventory', details: movementsResult.error.message });
    }

    const warrantyUntil = order.warranty_until;
    const warrantyUntilTime = warrantyUntil ? new Date(warrantyUntil).getTime() : Number.NaN;
    const isWarrantyActive = Number.isFinite(warrantyUntilTime) ? warrantyUntilTime >= Date.now() : false;
    const documents = normalizeDeviceHistoryDocuments((documentsResult.data ?? []) as DeviceHistoryDocumentRow[]);
    const consumedItems = normalizeDeviceHistoryMovements((movementsResult.data ?? []) as DeviceHistoryMovementRow[]);

    return res.status(200).json({
      success: true,
      data: {
        orderId,
        warrantyUntil,
        isWarrantyActive,
        serialNumber: order.serial_number,
        status: order.status,
        claims: ((claimsResult.data ?? []) as WarrantyClaimRow[]).map(normalizeWarrantyClaim),
        deviceHistorySummary: {
          serialNumber: order.serial_number,
          totalOrders: Array.isArray(historyResult.data) ? historyResult.data.length : 0,
          available: !historyResult.error,
        },
        documents: {
          total: documents.length,
          customerVisible: documents.filter((document) => document.isCustomerVisible).length,
          items: documents,
        },
        inventory: {
          consumedItems,
        },
      },
    });
  } catch (error) {
    console.error('Error getting warranty summary:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createOrderWarrantyClaim = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const body = warrantyClaimSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.rpc('create_service_order_warranty_claim', {
      p_tenant_id: tenantId,
      p_original_order_id: orderId,
      p_claim_order_id: body.claimOrderId ?? null,
      p_claim_reason: body.claimReason,
      p_reported_issue: body.reportedIssue || null,
      p_requested_resolution: body.requestedResolution || null,
      p_coverage_scope: body.coverageScope,
      p_created_by: req.user?.userId ?? null,
      p_request_id: requestIdFrom(req),
    });

    if (error) {
      return res.status(409).json({ error: 'Failed to create warranty claim', details: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating warranty claim:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateOrderWarrantyClaimStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const orderId = req.params.id;
    const claimId = req.params.claimId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId || !claimId) {
      return res.status(400).json({ error: 'Order id and claim id are required' });
    }

    const body = warrantyClaimStatusSchema.parse(req.body);
    const existingClaim = await supabaseAdmin
      .from('service_order_warranties')
      .select('id, original_order_id, claim_order_id')
      .eq('tenant_id', tenantId)
      .eq('id', claimId)
      .maybeSingle();

    if (existingClaim.error) {
      return res.status(502).json({ error: 'Failed to fetch warranty claim', details: existingClaim.error.message });
    }

    if (!existingClaim.data) {
      return res.status(404).json({ error: 'Warranty claim not found' });
    }

    const claim = existingClaim.data as Pick<WarrantyClaimRow, 'id' | 'original_order_id' | 'claim_order_id'>;
    if (claim.original_order_id !== orderId && claim.claim_order_id !== orderId) {
      return res.status(404).json({ error: 'Warranty claim not found for order' });
    }

    const { data, error } = await supabaseAdmin.rpc('update_service_order_warranty_claim_status', {
      p_tenant_id: tenantId,
      p_claim_id: claimId,
      p_status: body.status,
      p_resolution_notes: body.resolutionNotes || null,
      p_actor_id: req.user?.userId ?? null,
      p_request_id: requestIdFrom(req),
    });

    if (error) {
      return res.status(409).json({ error: 'Failed to update warranty claim status', details: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating warranty claim status:', error);
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

export const createOrderPayment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const orderId = req.params.id;
    if (!orderId) return res.status(400).json({ error: 'Order id is required' });

    const body = createPaymentSchema.parse(req.body);
    const scope = getRequestScope(req);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, sucursal_id, customer_id, final_cost, estimated_cost, status')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
      .single();

    if (orderError || !order) return res.status(404).json({ error: 'Order not found' });

    const statusLow = order.status.toLowerCase();
    if (statusLow.includes('cancel') || statusLow.includes('anulada')) {
      return res.status(400).json({ error: 'No se pueden registrar cobros sobre una orden cancelada o anulada' });
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId);

    if (paymentsError) return res.status(502).json({ error: 'Error al consultar pagos previos', details: paymentsError.message });

    const totalCobrado = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const finalCost = Number(order.final_cost) > 0 ? Number(order.final_cost) : Number(order.estimated_cost || 0);
    const saldoPendiente = Math.max(0, finalCost - totalCobrado);

    if (body.amount > saldoPendiente) {
      return res.status(400).json({ error: `El monto (${body.amount}) excede el saldo pendiente (${saldoPendiente})` });
    }

    // Insert payment
    const { data: newPayment, error: insertError } = await supabase
      .from('customer_payments')
      .insert([{
        tenant_id: tenantId,
        branch_id: order.sucursal_id,
        customer_id: order.customer_id,
        service_order_id: orderId,
        payment_type: 'cobro',
        amount: body.amount,
        payment_method: body.paymentMethod,
        reference: body.reference || null,
        notes: body.notes || null,
        created_by: req.user?.userId ?? null,
        source: 'manual'
      }])
      .select()
      .single();

    if (insertError) return res.status(502).json({ error: 'Failed to record payment', details: insertError.message });

    // Use existing insertOrderEvent mechanism for order history
    await insertOrderEvent(supabase, {
      id: randomUUID(),
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'payment_registered',
      previous_status: null,
      new_status: null,
      note: `Cobro registrado por $${body.amount} via ${body.paymentMethod}`,
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    return res.status(201).json({ success: true, data: newPayment });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error creating order payment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const refundOrderPayment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const orderId = req.params.id;
    const paymentId = req.params.paymentId;

    if (!orderId) return res.status(400).json({ error: 'Order id is required' });
    if (!paymentId) return res.status(400).json({ error: 'Payment id is required' });

    const body = refundPaymentSchema.parse(req.body);
    const scope = getRequestScope(req);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, sucursal_id, customer_id, status')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .eq(
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? 'sucursal_id' : 'tenant_id',
        scope?.mode === 'branch' && isUuid(scope.sucursalId) ? scope.sucursalId : tenantId,
      )
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { data: originalPayment, error: paymentError } = await supabase
      .from('customer_payments')
      .select('id, tenant_id, branch_id, customer_id, service_order_id, parent_payment_id, amount, payment_type, payment_method, reference')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .eq('id', paymentId)
      .single();

    if (paymentError || !originalPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const originalAmount = Number(originalPayment.amount || 0);

    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      return res.status(400).json({ error: 'Solo se pueden reembolsar cobros originales con monto positivo' });
    }

    if (originalPayment.parent_payment_id || String(originalPayment.payment_type || '').toLowerCase() === 'refund') {
      return res.status(400).json({ error: 'No se puede reembolsar un reembolso' });
    }

    const { data: refunds, error: refundsError } = await supabase
      .from('customer_payments')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('service_order_id', orderId)
      .eq('parent_payment_id', paymentId);

    if (refundsError) {
      return res.status(502).json({ error: 'Error al consultar reembolsos previos', details: refundsError.message });
    }

    const alreadyRefunded = (refunds || []).reduce((sum, refund) => {
      const amount = Number(refund.amount || 0);
      return sum + Math.abs(Number.isFinite(amount) ? amount : 0);
    }, 0);

    const refundableAmount = Math.max(0, originalAmount - alreadyRefunded);

    if (body.amount > refundableAmount) {
      return res.status(400).json({
        error: `El reembolso (${body.amount}) excede el monto disponible para reembolsar (${refundableAmount})`,
      });
    }

    const refundAmount = -Math.abs(body.amount);

    const { data: refundPayment, error: insertError } = await supabase
      .from('customer_payments')
      .insert([{
        tenant_id: tenantId,
        branch_id: originalPayment.branch_id ?? order.sucursal_id,
        customer_id: originalPayment.customer_id ?? order.customer_id,
        service_order_id: orderId,
        parent_payment_id: paymentId,
        payment_type: 'refund',
        amount: refundAmount,
        payment_method: originalPayment.payment_method || 'refund',
        reference: body.reference || `refund:${paymentId}`,
        notes: body.reason,
        refund_reason: body.reason,
        created_by: req.user?.userId ?? null,
        source: 'manual',
      }])
      .select()
      .single();

    if (insertError) {
      return res.status(502).json({ error: 'Failed to record refund', details: insertError.message });
    }

    await insertOrderEvent(supabase, {
      id: randomUUID(),
      tenant_id: tenantId,
      service_order_id: orderId,
      event_type: 'payment_refunded',
      previous_status: null,
      new_status: null,
      note: `Reembolso registrado por $${body.amount}. Motivo: ${body.reason}`,
      actor_name: req.user?.email ?? req.user?.role ?? 'system',
    });

    return res.status(201).json({ success: true, data: refundPayment });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error refunding order payment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
