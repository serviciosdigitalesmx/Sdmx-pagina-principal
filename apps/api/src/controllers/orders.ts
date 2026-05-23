import { Request, Response } from 'express';
import { z } from 'zod';
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

    const { error: eventError } = await supabase.from('service_order_events').insert([
      {
        tenant_id: tenantId,
        service_order_id: data.id,
        event_type: 'created',
        previous_status: null,
        new_status: 'recibido',
        note: validatedData.issue,
        actor_name: req.user?.email ?? req.user?.role ?? 'system',
        created_by: null,
      },
    ]);

    if (eventError) {
      console.error('Supabase event insert error:', eventError.message);
      return res.status(502).json({
        error: 'Failed to persist order event',
        details: eventError.message,
      });
    }

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
    const [orderResult, docsResult, eventsResult, checklistResult] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('id', orderId)
        .single(),
      supabase
        .from('service_order_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false }),
      supabase
        .from('service_order_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false }),
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

    if (docsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order documents', details: docsResult.error.message });
    }

    if (eventsResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order events', details: eventsResult.error.message });
    }

    if (checklistResult.error) {
      return res.status(502).json({ error: 'Failed to fetch order checklist', details: checklistResult.error.message });
    }

    return res.json({
      success: true,
      data: {
        order: orderResult.data,
        documents: docsResult.data ?? [],
        events: eventsResult.data ?? [],
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
      .select('id, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const bucketName = getStorageBucketName();
    await ensureBucketExists(bucketName);

    const createdDocuments = [];
    for (const file of parsed.files) {
      const fileBuffer = decodeBase64File(file.base64);
      const extension = getFileExtension(file.fileName, file.mimeType);
      const safeName = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `tenant/${tenantId}/orders/${orderId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(storagePath, fileBuffer, {
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
      const { data: docRow, error: docError } = await supabase
        .from('service_order_documents')
        .insert([
          {
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
          },
        ])
        .select()
        .single();

      if (docError) {
        return res.status(502).json({
          error: 'Failed to persist attachment metadata',
          details: docError.message,
        });
      }

      createdDocuments.push({
        ...docRow,
        extension,
      });
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

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = noteRequestSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .select('id, status')
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found', details: orderError?.message ?? 'Not found' });
    }

    const { data, error } = await supabase.from('service_order_events').insert([
      {
        tenant_id: tenantId,
        service_order_id: orderId,
        event_type: 'note',
        previous_status: order.status,
        new_status: order.status,
        note: body.note,
        actor_name: body.actorName ?? req.user?.email ?? req.user?.role ?? 'system',
        created_by: null,
      },
    ]).select().single();

    if (error) {
      return res.status(502).json({ error: 'Failed to persist order note', details: error.message });
    }

    return res.status(201).json({ success: true, data });
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
      .select('id, status')
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

    const { error: historyError } = await supabase.from('service_order_events').insert([
      {
        tenant_id: tenantId,
        service_order_id: orderId,
        event_type: 'status_changed',
        previous_status: previousStatus,
        new_status: nextStatus,
        note: body.note || null,
        actor_name: req.user?.email ?? req.user?.role ?? 'system',
        created_by: null,
      },
    ]);

    if (historyError) {
      return res.status(502).json({ error: 'Failed to persist status history', details: historyError.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
