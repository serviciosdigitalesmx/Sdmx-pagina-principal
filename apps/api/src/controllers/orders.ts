import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { getTenantClient, supabaseAdmin } from '@white-label/database';

const orderStatusSchema = z.enum(['recibido', 'diagnostico', 'reparacion', 'listo', 'entregado']);

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

async function generateReceiptPdf(options: {
  order: Record<string, unknown>;
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

  doc.fontSize(20).fillColor('#111827').text('Sr. Fix - Comprobante de Recepción', { align: 'center' });
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
  doc.fontSize(12).fillColor('#111827').text('Evidencia fotográfica', { underline: true });
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
  doc.fontSize(10).fillColor('#6b7280').text('Documento generado automáticamente por Sr. Fix.');
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

    await supabase
      .from('service_orders')
      .update({
        evidence_metadata: appendEvidenceEntry(data.evidence_metadata, {
          kind: 'event',
          id: randomUUID(),
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

    const pdfAttachment = buildPdfAttachment(validatedData.receiptUrl || null);

    return res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        ...data,
        final_cost: finalCost,
        estimated_cost: estimatedCost,
        receipt_url: validatedData.receiptUrl || null,
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

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('service_orders')
      .select('*, service_order_checklists(*)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(50);

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

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!orderId) {
      return res.status(400).json({ error: 'Order id is required' });
    }

    const supabase = getTenantClient(tenantId);
    const [orderResult, checklistResult] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', orderId)
        .single(),
      supabase
        .from('service_order_checklists')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .maybeSingle(),
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

    const evidenceMetadata = readEvidenceMetadata(orderResult.data.evidence_metadata);
    const documents = evidenceMetadata
      .filter((entry): entry is Extract<EvidenceEntry, { kind: 'document' }> => entry.kind === 'document')
      .map((entry) => ({
        id: entry.id,
        file_name: entry.file_name,
        file_type: entry.file_type,
        public_url: entry.public_url,
        mime_type: entry.mime_type,
        created_at: entry.created_at,
      }));
    const events = evidenceMetadata
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

    return res.json({
      success: true,
      data: {
        order: orderResult.data,
        documents,
        events,
        checklist: checklistResult.data ?? null,
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
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const bucketName = getStorageBucketName();
    await ensureBucketExists(bucketName);

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
      createdDocuments.push({
        id: randomUUID(),
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
      });

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

      const receiptPdfBuffer = await generateReceiptPdf({ order: latestOrder, photo: uploadedPhoto });
      const receiptUpload = await uploadBufferToStorage({
        tenantId,
        orderId,
        bucketName,
        fileName: 'recepcion.pdf',
        mimeType: 'application/pdf',
        buffer: receiptPdfBuffer,
        fileType: 'receipt_pdf',
      });

      const { error: receiptUpdateError } = await supabase
        .from('service_orders')
        .update({
          receipt_url: receiptUpload.publicUrl,
          evidence_metadata: appendEvidenceEntry(order.evidence_metadata, {
            kind: 'document',
            id: randomUUID(),
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
        id: randomUUID(),
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
    }

    const { data: latestEvidence } = await supabase
      .from('service_orders')
      .select('evidence_metadata')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .single();

    const updatedEvidence = appendEvidenceEntry(latestEvidence?.evidence_metadata, {
      kind: 'document',
      id: randomUUID(),
      file_name: parsed.files[0]?.fileName ?? 'archivo',
      file_type: parsed.files[0]?.fileType ?? 'attachment_pdf',
      public_url: null,
      mime_type: parsed.files[0]?.mimeType ?? 'application/octet-stream',
      created_at: new Date().toISOString(),
    });

    await supabase
      .from('service_orders')
      .update({ evidence_metadata: updatedEvidence })
      .eq('tenant_id', tenantId)
      .eq('id', orderId);

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
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const previousStatus = normalizeOrderStatus(order.status);
    const nextStatus = body.status;

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

    await supabase
      .from('service_orders')
      .update({
        evidence_metadata: appendEvidenceEntry(data.evidence_metadata, {
          kind: 'event',
          id: randomUUID(),
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

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
