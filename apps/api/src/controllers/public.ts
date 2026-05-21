import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient, supabaseAdmin } from '@white-label/database';

type PdfAttachment = {
  type: 'receipt_pdf';
  label: string;
  url: string;
  fileName: string | null;
  mimeType: string;
  source: 'stored_url' | 'inline_data_url';
};

const publicQuoteSchema = z.object({
  tenantSlug: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  issue: z.string().min(1),
});

const publicTrackingSchema = z.object({
  tenantSlug: z.string().min(1),
  folio: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
});

const publicPortalSchema = z.object({
  tenantSlug: z.string().min(1),
  folio: z.string().min(1),
});

async function resolveTenantIdBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Tenant not found');
  }

  return data;
}

function buildPdfAttachment(receiptUrl?: string | null): PdfAttachment | null {
  if (!receiptUrl) {
    return null;
  }

  const isDataUrl = receiptUrl.startsWith('data:');
  return {
    type: 'receipt_pdf',
    label: 'PDF de la orden',
    url: receiptUrl,
    fileName: isDataUrl ? null : 'recepcion.pdf',
    mimeType: 'application/pdf',
    source: isDataUrl ? 'inline_data_url' : 'stored_url',
  };
}

export async function createPublicQuote(req: Request, res: Response) {
  const parsed = publicQuoteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, fullName, phone, email, deviceBrand, deviceModel, issue } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const supabase = getTenantClient(tenant.id);

    const { data, error } = await supabase
      .from('service_requests')
      .insert([
        {
          tenant_id: tenant.id,
          folio: `REQ-${Date.now().toString(36).toUpperCase()}`,
          customer_name: fullName,
          customer_phone: phone,
          customer_email: email || null,
          device_type: deviceBrand,
          device_model: deviceModel,
          issue_description: issue,
          status: 'pendiente',
          quoted_total: 0,
          deposit_amount: 0,
          balance_amount: 0,
          solicitud_origen_ip: req.ip ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to create quote request', details: error.message });
    }

    return res.status(201).json({ success: true, tenant, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

export async function trackPublicOrder(req: Request, res: Response) {
  const parsed = publicTrackingSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, folio, email } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const supabase = getTenantClient(tenant.id);
    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, total_cost, created_at, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost')
      .eq('tenant_id', tenant.id)
      .eq('folio', folio)
      .single();

    if (error) {
      return res.status(404).json({ error: 'No encontramos tu reparación', details: error.message });
    }

    if (email && data.device_info?.customer_email && data.device_info.customer_email !== email) {
      return res.status(403).json({ error: 'No encontramos una coincidencia con ese correo' });
    }

    return res.json({ success: true, tenant, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}

export async function getPublicPortalOrder(req: Request, res: Response) {
  const parsed = publicPortalSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, folio } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const supabase = getTenantClient(tenant.id);

    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, total_cost, created_at, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost')
      .eq('tenant_id', tenant.id)
      .eq('folio', folio)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'No encontramos tu reparación', details: error?.message });
    }

    const statusLabelMap: Record<string, string> = {
      pending: 'Recibido',
      pendiente: 'Recibido',
      diagnostico: 'Diagnóstico',
      diagnosticado: 'Diagnóstico',
      reparacion: 'En reparación',
      reparando: 'En reparación',
      listo: 'Listo',
      entregado: 'Entregado',
    };

    const statusKey = String(data.status ?? '').toLowerCase();
    const timeline = [
      { label: 'Recepción', status: 'completado' as const, note: 'Orden registrada en el sistema.' },
      {
        label: 'Diagnóstico',
        status: ['diagnostico', 'reparacion', 'listo', 'entregado'].includes(statusKey) ? 'completado' as const : 'actual' as const,
        note: 'Evaluación técnica del equipo.',
      },
      {
        label: 'Reparación',
        status: ['reparacion', 'listo', 'entregado'].includes(statusKey) ? 'completado' as const : 'actual' as const,
        note: 'Trabajo técnico en proceso.',
      },
      {
        label: 'Entrega',
        status: ['listo', 'entregado'].includes(statusKey) ? 'actual' as const : 'pendiente' as const,
        note: 'Lista para entregar al cliente.',
      },
    ];

    const pdfAttachment = buildPdfAttachment(data.receipt_url);

    return res.json({
      success: true,
      tenant,
      data: {
        order: data,
        orderStatusLabel: statusLabelMap[statusKey] ?? String(data.status ?? 'Sin estado'),
        timeline,
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
