import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { buildSimplePdf } from '../lib/pdf.js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase environment variables are required for public controllers');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

type PublicRequestBody = {
  tenantSlug?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  reportedIssue?: string;
  estimatedCost?: number | null;
};

const nowIso = () => new Date().toISOString();

function buildPortalUrl(folio?: string): string {
  const baseUrl = String(process.env.PUBLIC_APP_URL || process.env.APP_URL || '').replace(/\/$/, '');
  const path = folio ? `/portal?folio=${encodeURIComponent(folio)}` : '/portal';
  return baseUrl ? `${baseUrl}${path}` : path;
}

export async function getPublicTenant(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from('tenants')
      .select('id,name,slug')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tenant no encontrado' } });
    return res.status(200).json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        landingUrl: `/landing/${data.slug}`,
        portalUrl: buildPortalUrl()
      }
    });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: e.message } });
  }
}

export async function createPublicRequest(req: Request, res: Response) {
  try {
    const body = req.body as PublicRequestBody;
    const tenantSlug = String(body.tenantSlug || '').trim();
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const deviceType = String(body.deviceType || '').trim();
    const reportedIssue = String(body.reportedIssue || '').trim();

    if (!tenantSlug) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'tenantSlug es obligatorio' } });
    if (!fullName) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'fullName es obligatorio' } });
    if (!email) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'email es obligatorio' } });
    if (!deviceType) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'deviceType es obligatorio' } });
    if (!reportedIssue) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'reportedIssue es obligatorio' } });

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id,name,slug')
      .eq('slug', tenantSlug)
      .maybeSingle();

    if (tenantError || !tenant) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Tenant no encontrado' } });
    }

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('email', email)
      .maybeSingle();

    const customerId = existingCustomer?.id || randomUUID();
    if (!existingCustomer) {
      const { error: customerError } = await supabase.from('customers').insert({
        id: customerId,
        tenant_id: tenant.id,
        full_name: fullName,
        email,
        phone: body.phone || null,
        created_at: nowIso(),
        updated_at: nowIso()
      });
      if (customerError) throw customerError;
    }

    const { data: order, error: orderError } = await supabase
      .from('service_orders')
      .insert({
        id: randomUUID(),
        tenant_id: tenant.id,
        branch_id: null,
        customer_id: customerId,
        folio: `REQ-${Date.now().toString().slice(-8)}`,
        status: 'solicitud',
        device_type: deviceType,
        device_brand: body.deviceBrand?.trim() || null,
        device_model: body.deviceModel?.trim() || null,
        reported_issue: reportedIssue,
        estimated_cost: body.estimatedCost ?? null,
        notes: null,
        reception_checklist: null,
        reception_photo_base64: null,
        source_quote_folio: null,
        promised_date: null,
        created_at: nowIso(),
        updated_at: nowIso()
      })
      .select('folio,status')
      .maybeSingle();

    if (orderError || !order) throw orderError || new Error('No se pudo crear la orden');

    return res.status(200).json({
      success: true,
      data: {
        tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
        customer: { id: customerId },
        serviceOrder: { folio: order.folio, status: order.status },
        portalUrl: buildPortalUrl(order.folio)
      }
    });
  } catch (e: any) {
    return res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: e.message } });
  }
}

export async function generateOrderPdf(req: Request, res: Response) {
  try {
    const { folio } = req.params;
    const { data: order, error } = await supabase
      .from('service_orders')
      .select('folio,status,device_type,device_brand,device_model,reported_issue,promised_date,updated_at,tenant_id')
      .eq('folio', folio)
      .maybeSingle();

    if (error) throw error;
    if (!order) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Folio no encontrado' } });

    const lines = [
      { text: 'Fixi - Orden de Servicio', size: 20, bold: true },
      { text: `Folio: ${order.folio}`, size: 14, bold: true },
      { text: `Estado: ${order.status}`, size: 12 },
      { text: `Equipo: ${[order.device_type, order.device_brand, order.device_model].filter(Boolean).join(' ') || 'No definido'}`, size: 12 },
      { text: `Falla reportada: ${order.reported_issue || 'No definida'}`, size: 12 },
      { text: `Entrega estimada: ${order.promised_date || 'No definida'}`, size: 12 },
      { text: `Última actualización: ${order.updated_at || 'No definida'}`, size: 12 },
      { text: `Tenant: ${order.tenant_id}`, size: 10 }
    ];

    const pdfBuffer = buildSimplePdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=\"orden-${order.folio}.pdf\"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    return res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: error?.message || 'PDF error' } });
  }
}
