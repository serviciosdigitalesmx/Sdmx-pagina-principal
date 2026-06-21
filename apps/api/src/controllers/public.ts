import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import PDFDocument from 'pdfkit';
import { z } from 'zod';
import { getTenantClient, supabaseAdmin } from '@white-label/database';
import { getRequestIp } from '../lib/request-ip';
import { loadTenantRuntimeConfig } from '../services/tenant-config';
import { cleanTenantTextField, getMissingRequiredTextField } from '../services/tenant-fields';
import { getEvidenceMetadata } from '../services/evidence-adapter';
import { FEATURE_EVIDENCE_MODE } from '../config/feature-flags';

type PdfAttachment = {
  type: 'receipt_pdf';
  label: string;
  url: string;
  fileName: string | null;
  mimeType: string;
  source: 'stored_url' | 'inline_data_url';
};

type LandingService = {
  title: string;
  description: string;
};

type LandingSocialLink = {
  label: string;
  href: string;
};

type LandingContent = {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  contactLabel?: string;
  contactHref?: string;
  seoTitle?: string;
  seoDescription?: string;
  services?: LandingService[];
  socialLinks?: LandingSocialLink[];
  showMap?: boolean;
  mapEmbedUrl?: string;
  showVideo?: boolean;
  videoUrl?: string;
};

type LandingTemplate = {
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  contactLabel?: string;
  contactHref?: string;
  services?: LandingService[];
  socialLinks?: LandingSocialLink[];
  showMap?: boolean;
  mapEmbedUrl?: string;
  showVideo?: boolean;
  videoUrl?: string;
};

type ContactInfo = {
  contactPhone: string | null;
  contactEmail: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

const publicQuoteSchema = z.object({
  tenantSlug: z.string().min(1),
  fullName: z.string().min(1),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  deviceBrand: z.string().min(1),
  deviceModel: z.string().min(1),
  issue: z.string().min(1),
  deviceType: z.string().optional().or(z.literal('')),
  serialNumber: z.string().optional().or(z.literal('')),
  priorityLevel: z.string().optional().or(z.literal('')),
  passwordOrPin: z.string().optional().or(z.literal('')),
  metadata: z.record(z.unknown()).optional(),
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

const publicCatalogSchema = z.object({
  tenantSlug: z.string().min(1),
});

const publicCheckoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const publicCheckoutSchema = z.object({
  tenantSlug: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(7),
  customerEmail: z.string().email().optional().or(z.literal('')),
  shippingAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(publicCheckoutItemSchema).min(1),
});

async function resolveTenantIdBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, branding, landing_content')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    const message = error?.message ?? 'Tenant not found';
    const notFound = !data || /single json object/i.test(message) || /0 rows/i.test(message);
    const tenantError = new Error(message);
    tenantError.name = notFound ? 'TenantNotFoundError' : 'TenantLookupError';
    throw tenantError;
  }

  return data;
}

async function loadPublicCatalog(tenantId: string) {
  const supabase = getTenantClient(tenantId);
  const [productsResult, inventoryResult] = await Promise.all([
    supabase
      .from('products')
      .select('id, tenant_id, sku, name, category, brand, sale_price, cost, minimum_stock, unit, location, notes, is_active, created_at')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('sucursal_inventory')
      .select('product_id, stock_current')
      .eq('tenant_id', tenantId)
      .limit(500),
  ]);

  if (productsResult.error) {
    throw new Error(`Failed to load products: ${productsResult.error.message}`);
  }

  if (inventoryResult.error) {
    throw new Error(`Failed to load inventory: ${inventoryResult.error.message}`);
  }

  const stockByProductId = new Map<string, number>();
  for (const row of inventoryResult.data ?? []) {
    const productId = String((row as { product_id?: string }).product_id ?? '');
    if (!productId) continue;
    const currentStock = Number((row as { stock_current?: number }).stock_current ?? 0);
    stockByProductId.set(productId, (stockByProductId.get(productId) ?? 0) + currentStock);
  }

  return (productsResult.data ?? []).map((product) => {
    const salePrice = Number((product as { sale_price?: number | null }).sale_price ?? 0);
    const cost = Number((product as { cost?: number | null }).cost ?? 0);
    const minimumStock = Number((product as { minimum_stock?: number | null }).minimum_stock ?? 0);
    const stockCurrent = stockByProductId.get(String((product as { id?: string }).id ?? '')) ?? 0;
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category ?? null,
      brand: product.brand ?? null,
      sale_price: salePrice,
      cost,
      minimum_stock: minimumStock,
      unit: product.unit ?? null,
      location: product.location ?? null,
      notes: product.notes ?? null,
      is_active: product.is_active,
      stock_current: stockCurrent,
      in_stock: stockCurrent > 0,
      inventory_state: stockCurrent <= 0 ? 'agotado' : stockCurrent <= minimumStock ? 'bajo' : 'disponible',
    };
  });
}

function extractContactInfo(input: unknown): ContactInfo {
  const content = input && typeof input === 'object' ? (input as LandingContent) : {};
  const rawHref = typeof content.contactHref === 'string' ? content.contactHref.trim() : '';
  let contactPhone: string | null = null;
  let contactEmail: string | null = null;

  if (rawHref) {
    if (rawHref.startsWith('mailto:')) {
      contactEmail = rawHref.slice('mailto:'.length).trim() || null;
    } else if (rawHref.startsWith('tel:')) {
      contactPhone = rawHref.slice('tel:'.length).trim() || null;
    } else if (rawHref.includes('wa.me')) {
      const digits = rawHref.replace(/\D/g, '');
      contactPhone = digits.length > 0 ? digits : null;
    } else if (rawHref.includes('@')) {
      contactEmail = rawHref;
    } else if (/^\+?\d[\d\s().-]+$/.test(rawHref)) {
      contactPhone = rawHref;
    }
  }

  return {
    contactPhone,
    contactEmail,
    contact_phone: contactPhone,
    contact_email: contactEmail,
  };
}

function normalizeLandingContent(input: unknown, tenantName: string, tenantSlug: string): Required<LandingContent> {
  const content = input && typeof input === 'object' ? (input as LandingContent) : {};
  const services = Array.isArray(content.services)
    ? content.services.filter((item): item is LandingService => Boolean(item && item.title && item.description))
    : [];
  const socialLinks = Array.isArray(content.socialLinks)
    ? content.socialLinks.filter((item): item is LandingSocialLink => Boolean(item && item.label && item.href))
    : [];

  return {
    heroTitle: content.heroTitle?.trim() || tenantName,
    heroSubtitle: content.heroSubtitle?.trim() || 'Landing pública por tenant',
    heroDescription: content.heroDescription?.trim() || 'Cotización, estado y contacto directo con marca propia.',
    primaryCtaLabel: content.primaryCtaLabel?.trim() || 'Cotizar ahora',
    primaryCtaHref: content.primaryCtaHref?.trim() || '/onboarding',
    secondaryCtaLabel: content.secondaryCtaLabel?.trim() || 'Ver estatus',
    secondaryCtaHref: content.secondaryCtaHref?.trim() || '/login',
    contactLabel: content.contactLabel?.trim() || 'WhatsApp / contacto',
    contactHref: content.contactHref?.trim() || '',
    seoTitle: content.seoTitle?.trim() || tenantName,
    seoDescription: content.seoDescription?.trim() || `Landing pública del taller ${tenantSlug}.`,
    services,
    socialLinks,
    showMap: Boolean(content.showMap),
    mapEmbedUrl: content.mapEmbedUrl?.trim() || '',
    showVideo: Boolean(content.showVideo),
    videoUrl: content.videoUrl?.trim() || '',
  };
}

function mergeLandingContent(
  rawLandingContent: unknown,
  landingTemplate: LandingTemplate | null,
  tenantName: string,
  tenantSlug: string,
): Required<LandingContent> {
  const normalized = normalizeLandingContent(rawLandingContent, tenantName, tenantSlug);
  const template = landingTemplate ?? {};

  return {
    heroTitle: template.heroTitle?.trim() || normalized.heroTitle,
    heroSubtitle: template.heroSubtitle?.trim() || normalized.heroSubtitle,
    heroDescription: template.heroDescription?.trim() || normalized.heroDescription,
    primaryCtaLabel: template.primaryCtaLabel?.trim() || normalized.primaryCtaLabel,
    primaryCtaHref: template.primaryCtaHref?.trim() || normalized.primaryCtaHref,
    secondaryCtaLabel: template.secondaryCtaLabel?.trim() || normalized.secondaryCtaLabel,
    secondaryCtaHref: template.secondaryCtaHref?.trim() || normalized.secondaryCtaHref,
    contactLabel: template.contactLabel?.trim() || normalized.contactLabel,
    contactHref: template.contactHref?.trim() || normalized.contactHref,
    seoTitle: normalized.seoTitle,
    seoDescription: normalized.seoDescription,
    services: Array.isArray(template.services) && template.services.length > 0 ? template.services : normalized.services,
    socialLinks: Array.isArray(template.socialLinks) && template.socialLinks.length > 0 ? template.socialLinks : normalized.socialLinks,
    showMap: typeof template.showMap === 'boolean' ? template.showMap : normalized.showMap,
    mapEmbedUrl: template.mapEmbedUrl?.trim() || normalized.mapEmbedUrl,
    showVideo: typeof template.showVideo === 'boolean' ? template.showVideo : normalized.showVideo,
    videoUrl: template.videoUrl?.trim() || normalized.videoUrl,
  };
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

function formatMoney(amount?: number | null) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(Number(amount)) ? Number(amount) : 0);
}

function formatLongDate(value?: string | null) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleDateString('es-MX', { dateStyle: 'long' });
}

function formatLongDateTime(value?: string | null) {
  if (!value) return 'No disponible';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return date.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
}

function getBrandingValue(branding: Record<string, unknown> | null, key: string) {
  const value = branding && typeof branding[key] === 'string' ? String(branding[key]).trim() : '';
  return value || '';
}

async function bufferFromPdf(doc: InstanceType<typeof PDFDocument>) {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: unknown) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer)));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

async function fetchImageBuffer(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function generateOrderPdf(params: {
  tenantName: string;
  branding: Record<string, unknown> | null;
  order: {
    folio: string;
    status: string;
    created_at?: string | null;
    updated_at?: string | null;
    promised_date?: string | null;
    device_info?: {
      customer_name?: string | null;
      customer_phone?: string | null;
      customer_email?: string | null;
      type?: string | null;
      brand?: string | null;
      model?: string | null;
      serial_number?: string | null;
    } | null;
    problem_description?: string | null;
    estimated_cost?: number | null;
    final_cost?: number | null;
  };
  documents: Array<{ file_name: string; file_type: string; public_url: string | null }>;
}) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const branding = params.branding;
  const logoUrl = getBrandingValue(branding, 'logoUrl');
  const primaryColor = getBrandingValue(branding, 'primaryColor') || '#0f172a';
  const secondaryColor = getBrandingValue(branding, 'secondaryColor') || '#0284c7';
  const logoBuffer = logoUrl ? await fetchImageBuffer(logoUrl) : null;

  const customer = params.order.device_info ?? {};
  const quoteTotal = Number(params.order.final_cost ?? params.order.estimated_cost ?? 0) || 0;
  const quoteSubtotal = quoteTotal / 1.16;
  const quoteIva = quoteTotal - quoteSubtotal;
  const conceptLabel = params.order.problem_description?.trim() || `Servicio para ${customer.type ?? 'equipo'}`;
  const conceptDetail = [customer.brand, customer.model, params.order.folio].filter(Boolean).join(' • ');
  const quoteItems = [
    {
      qty: 1,
      description: `Diagnóstico / reparación de ${customer.type ?? 'equipo'}`,
      detail: conceptDetail || 'Servicio integral',
      unit: quoteSubtotal,
      subtotal: quoteSubtotal,
    },
    {
      qty: 1,
      description: conceptLabel,
      detail: 'Incluye revisión técnica y validación del equipo.',
      unit: 0,
      subtotal: 0,
    },
  ];

  const pageWidth = 515;
  const leftX = 40;
  const rightX = 300;
  const headerTop = 28;
  const moneyFormatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatMoney = (amount?: number | null) => moneyFormatter.format(Number.isFinite(Number(amount)) ? Number(amount) : 0);

  const drawHeader = () => {
    doc.roundedRect(40, headerTop, 220, 130, 26).fillAndStroke('#07111f', '#07111f');
    doc.roundedRect(256, headerTop + 8, 18, 114, 18).fill(secondaryColor);
    doc.moveTo(236, headerTop).lineTo(290, headerTop).lineTo(346, 158).lineTo(292, 158).closePath().fill(primaryColor);

    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 54, 48, { fit: [74, 46], align: 'center', valign: 'center' });
      } catch {
        // logo opcional
      }
    } else {
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(23).text((params.tenantName || 'FX').slice(0, 10).toUpperCase(), 52, 56, { width: 166 });
    }

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text(params.tenantName.toUpperCase(), 128, 50, { width: 118 });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#cbd5e1').text('REPARACIÓN DE ELECTRÓNICOS', 128, 76, { width: 120 });
    doc.font('Helvetica').fontSize(9).fillColor('#e2e8f0').text('Soluciones confiables, siempre a tu alcance.', 52, 104, { width: 168, lineGap: 2 });

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(28).text('COTIZACIÓN', 332, 52, { width: 180 });
    doc.moveTo(332, 96).lineTo(555, 96).strokeColor(primaryColor).lineWidth(1.1).stroke();
    doc.font('Helvetica-Bold').fontSize(12).fillColor(primaryColor).text(`N° ${params.order.folio}`, 475, 102, { width: 60, align: 'right' });

    const metaStartY = 126;
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a');
    doc.text('Fecha:', 334, metaStartY, { width: 48 });
    doc.text(formatLongDateTime(params.order.created_at), 392, metaStartY, { width: 160, align: 'right' });
    doc.text('Válida hasta:', 334, metaStartY + 24, { width: 84 });
    doc.text(formatLongDate(params.order.promised_date), 392, metaStartY + 24, { width: 160, align: 'right' });
    doc.text('Cotización para:', 334, metaStartY + 48, { width: 96 });
    doc.text(customer.customer_name ?? 'Cliente', 430, metaStartY + 48, { width: 122, align: 'right' });
  };

  const labelLine = (label: string, value: string, x: number, y: number, width: number, labelWidth = 72) => {
    doc.font('Helvetica').fontSize(10).fillColor('#111827').text(label, x, y, { width: labelWidth });
    doc.moveTo(x + labelWidth + 8, y + 12).lineTo(x + width, y + 12).strokeColor('#cbd5e1').lineWidth(1).stroke();
    doc.text(value, x + labelWidth + 14, y, { width: width - labelWidth - 14 });
  };

  const sectionTitle = (title: string, x: number, y: number, iconFill = primaryColor) => {
    doc.circle(x + 9, y + 8, 8).fill(iconFill);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(title, x + 22, y);
  };

  drawHeader();

  sectionTitle('DATOS DEL CLIENTE', leftX, 176);
  sectionTitle('DATOS DEL EQUIPO', rightX, 176);
  labelLine('Nombre:', customer.customer_name ?? 'No disponible', leftX, 206, 250);
  labelLine('Teléfono:', customer.customer_phone ?? 'No disponible', leftX, 234, 250);
  labelLine('Correo:', customer.customer_email ?? 'No disponible', leftX, 262, 250);
  labelLine('Dirección:', 'No disponible', leftX, 290, 250);
  labelLine('Marca:', customer.brand ?? 'No disponible', rightX, 206, 255);
  labelLine('Modelo:', customer.model ?? 'No disponible', rightX, 234, 255);
  labelLine('IMEI / Serie:', customer.serial_number ?? 'No disponible', rightX, 262, 255);
  labelLine('Falla reportada:', params.order.problem_description ?? 'No disponible', rightX, 290, 255);

  const tableTop = 338;
  doc.roundedRect(40, tableTop, pageWidth, 36, 8).fillAndStroke(primaryColor, primaryColor);
  const headers = [
    { text: 'CANT.', x: 40, w: 52, align: 'center' as const },
    { text: 'DESCRIPCIÓN', x: 92, w: 222, align: 'left' as const },
    { text: 'DETALLE', x: 314, w: 118, align: 'left' as const },
    { text: 'PRECIO UNITARIO', x: 432, w: 123, align: 'right' as const },
  ];
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
  headers.forEach((header) => doc.text(header.text, header.x + 6, tableTop + 11, { width: header.w - 12, align: header.align }));

  const rowHeight = 40;
  quoteItems.forEach((item, index) => {
    const y = tableTop + 36 + (index * rowHeight);
    doc.rect(40, y, pageWidth, rowHeight).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(10).fillColor('#111827');
    doc.text(String(item.qty), 40, y + 12, { width: 52, align: 'center' });
    doc.text(item.description, 92, y + 10, { width: 220 });
    doc.text(item.detail, 314, y + 10, { width: 118 });
    doc.text(formatMoney(item.unit), 432, y + 12, { width: 123, align: 'right' });
  });

  const summaryTop = tableTop + 36 + (quoteItems.length * rowHeight) + 14;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('SUBTOTAL', 348, summaryTop);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(formatMoney(quoteSubtotal), 470, summaryTop, { width: 95, align: 'right' });
  doc.moveTo(348, summaryTop + 18).lineTo(555, summaryTop + 18).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('DESCUENTO', 348, summaryTop + 28);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(formatMoney(0), 470, summaryTop + 28, { width: 95, align: 'right' });
  doc.moveTo(348, summaryTop + 46).lineTo(555, summaryTop + 46).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text('IVA (16%)', 348, summaryTop + 56);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(formatMoney(quoteIva), 470, summaryTop + 56, { width: 95, align: 'right' });
  doc.roundedRect(345, summaryTop + 74, 210, 36, 8).fillAndStroke(primaryColor, primaryColor);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text('TOTAL', 358, summaryTop + 85);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text(formatMoney(quoteTotal), 470, summaryTop + 85, { width: 95, align: 'right' });

  const conditionsTop = summaryTop + 126;
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('CONDICIONES', 40, conditionsTop);
  doc.moveTo(40, conditionsTop + 18).lineTo(290, conditionsTop + 18).strokeColor(primaryColor).lineWidth(1).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text([
    '• Garantía según políticas del taller y tipo de reparación.',
    '• La cotización está sujeta a diagnóstico técnico final.',
    '• No cubre daños por mal uso o intervención externa.',
    '• El tiempo de entrega puede variar por disponibilidad de refacciones.',
  ].join('\n'), 40, conditionsTop + 28, { width: 245, lineGap: 5 });

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('NOTAS', 40, conditionsTop + 118);
  doc.moveTo(40, conditionsTop + 136).lineTo(290, conditionsTop + 136).strokeColor(primaryColor).lineWidth(1).stroke();
  doc.roundedRect(40, conditionsTop + 148, 245, 74, 10).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text('Cotización comercial generada para el tenant. Los importes y el alcance se validan con el diagnóstico y la aceptación del cliente.', 50, conditionsTop + 164, { width: 225, lineGap: 4 });

  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('ACEPTACIÓN DEL CLIENTE', 318, conditionsTop + 118);
  doc.moveTo(318, conditionsTop + 136).lineTo(555, conditionsTop + 136).strokeColor(primaryColor).lineWidth(1).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text('Acepto los términos y condiciones de esta cotización.', 318, conditionsTop + 150, { width: 220 });
  doc.moveTo(352, conditionsTop + 194).lineTo(535, conditionsTop + 194).strokeColor('#64748b').lineWidth(0.8).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#111827').text('Firma', 420, conditionsTop + 198, { width: 60, align: 'center' });
  doc.text('Fecha: ____ / ____ / ______', 390, conditionsTop + 220, { width: 140, align: 'center' });

  doc.moveTo(40, 752).lineTo(555, 752).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
  doc.font('Helvetica').fontSize(9).fillColor('#334155').text(`${params.tenantName} · ${customer.customer_phone ?? 'Sin teléfono'} · ${customer.customer_email ?? 'Sin correo'}`, 40, 762, { width: 515, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text('¡Gracias por confiar en nosotros!', 40, 780, { width: 515, align: 'center' });

  doc.addPage({ size: 'A4', margin: 40 });
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text('EVIDENCIA FOTOGRÁFICA', 40, 36);
  doc.moveTo(40, 62).lineTo(555, 62).strokeColor(primaryColor).lineWidth(1.2).stroke();
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Fotografías cargadas durante la recepción de la orden.', 40, 72);

  const imageDocs = params.documents.filter((item) => {
    const isImage = /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(item.file_name) || /image\//i.test(item.file_type) || /image\//i.test(item.public_url ?? '');
    return Boolean(item.public_url) && isImage;
  });

  if (imageDocs.length === 0) {
    doc.roundedRect(40, 110, 515, 120, 10).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(11).fillColor('#334155').text('No hay fotografías disponibles para esta orden.', 40, 160, { width: 515, align: 'center' });
  } else {
    const grid = [
      { x: 40, y: 112, w: 248, h: 164 },
      { x: 307, y: 112, w: 248, h: 164 },
      { x: 40, y: 300, w: 248, h: 164 },
      { x: 307, y: 300, w: 248, h: 164 },
      { x: 40, y: 488, w: 248, h: 164 },
      { x: 307, y: 488, w: 248, h: 164 },
    ];
    for (let index = 0; index < Math.min(imageDocs.length, grid.length); index += 1) {
      const item = imageDocs[index];
      const box = grid[index];
      doc.roundedRect(box.x, box.y, box.w, box.h, 12).strokeColor('#cbd5e1').lineWidth(0.8).stroke();
      const imageBuffer = item.public_url ? await fetchImageBuffer(item.public_url) : null;
      if (imageBuffer) {
        try {
          doc.image(imageBuffer, box.x + 10, box.y + 10, { fit: [box.w - 20, box.h - 42], align: 'center', valign: 'center' });
        } catch {
          doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Imagen no disponible', box.x + 10, box.y + 58, { width: box.w - 20, align: 'center' });
        }
      } else {
        doc.font('Helvetica').fontSize(10).fillColor('#64748b').text('Imagen no disponible', box.x + 10, box.y + 58, { width: box.w - 20, align: 'center' });
      }
      doc.font('Helvetica').fontSize(9).fillColor('#111827').text(item.file_name, box.x + 10, box.y + box.h - 24, { width: box.w - 20, align: 'center' });
    }
  }

  return await bufferFromPdf(doc);
}

export async function createPublicQuote(req: Request, res: Response) {
  const parsed = publicQuoteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, fullName, phone, email, deviceBrand, deviceModel, issue, deviceType, serialNumber, priorityLevel, passwordOrPin } = parsed.data;
    const metadata = parsed.data.metadata ?? {};
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const supabase = getTenantClient(tenant.id);
    const normalizedSerialNumber = cleanTenantTextField(serialNumber);
    const missingSerialField = getMissingRequiredTextField(runtimeConfig, 'service_requests', 'serial_number', normalizedSerialNumber);

    if (missingSerialField) {
      return res.status(400).json({
        error: 'Required device field is missing',
        details: { entity: 'service_requests', fields: [missingSerialField] },
      });
    }

    const requestMetadata = {
      ...metadata,
      device_type: deviceType || deviceBrand,
      device_brand: deviceBrand,
      device_model: deviceModel,
      serial_number: normalizedSerialNumber,
      priority_level: priorityLevel || null,
      password_or_pin: passwordOrPin || null,
    };

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
          serial_number: normalizedSerialNumber,
          issue_description: issue,
          metadata: requestMetadata,
          status: 'pendiente',
          quoted_total: 0,
          deposit_amount: 0,
          balance_amount: 0,
          solicitud_origen_ip: getRequestIp(req.headers, req.ip),
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to create quote request', details: error.message });
    }

    return res.status(201).json({
      success: true,
      tenant: {
        ...tenant,
        config: runtimeConfig,
      },
      data,
    });
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
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const supabase = getTenantClient(tenant.id);
    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, created_at, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost, metadata')
      .eq('tenant_id', tenant.id)
      .eq('folio', folio)
      .maybeSingle();

    if (error) {
      return res.status(502).json({ error: 'Failed to query order', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'No encontramos tu reparación', details: 'Order not found' });
    }

    if (email && data.device_info?.customer_email && data.device_info.customer_email !== email) {
      return res.status(403).json({ error: 'No encontramos una coincidencia con ese correo' });
    }

    return res.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding ?? null,
        ...extractContactInfo(tenant.landing_content),
        config: runtimeConfig,
      },
      data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
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
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const supabase = getTenantClient(tenant.id);
    const searchValue = folio.trim();

    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, created_at, updated_at, promised_date, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost, metadata')
      .eq('tenant_id', tenant.id)
      .or(`folio.eq.${searchValue},public_token.eq.${searchValue}`)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'No encontramos una orden con ese folio', details: error?.message });
    }

    const { data: documents, error: documentsError } = await supabase
      .from('service_order_documents')
      .select('id, file_name, file_type, public_url, mime_type, created_at, source')
      .eq('tenant_id', tenant.id)
      .eq('service_order_id', data.id)
      .order('created_at', { ascending: true });

    if (documentsError) {
      return res.status(502).json({ error: 'Failed to load documents', details: documentsError.message });
    }

    const { data: events, error: eventsError } = await supabase
      .from('service_order_events')
      .select('id, event_type, previous_status, new_status, note, actor_name, created_at')
      .eq('tenant_id', tenant.id)
      .eq('service_order_id', data.id)
      .order('created_at', { ascending: true });

    if (eventsError) {
      return res.status(502).json({ error: 'Failed to load events', details: eventsError.message });
    }

    const evidenceMetadata = (await getEvidenceMetadata(data.id, FEATURE_EVIDENCE_MODE)) ?? [];
    const metadataDocuments = evidenceMetadata
      .filter((entry) => entry && typeof entry === 'object' && (entry as { kind?: string }).kind === 'document')
      .map((entry) => {
        const document = entry as Record<string, unknown>;
        return {
          id: String(document.id ?? ''),
          file_name: String(document.file_name ?? ''),
          file_type: String(document.file_type ?? 'attachment_pdf'),
          public_url: typeof document.public_url === 'string' ? document.public_url : null,
          mime_type: String(document.mime_type ?? 'application/octet-stream'),
          created_at: String(document.created_at ?? new Date().toISOString()),
          source: 'metadata',
        };
      });
    const metadataEvents = evidenceMetadata
      .filter((entry) => entry && typeof entry === 'object' && (entry as { kind?: string }).kind === 'event')
      .map((entry) => {
        const event = entry as Record<string, unknown>;
        return {
          id: String(event.id ?? ''),
          event_type: String(event.event_type ?? 'note'),
          previous_status: typeof event.previous_status === 'string' ? event.previous_status : null,
          new_status: typeof event.new_status === 'string' ? event.new_status : null,
          note: typeof event.note === 'string' ? event.note : null,
          actor_name: typeof event.actor_name === 'string' ? event.actor_name : null,
          created_at: String(event.created_at ?? new Date().toISOString()),
        };
      });

    const normalizedDocuments = [
      ...(documents ?? []).map((entry) => ({
        id: entry.id,
        file_name: entry.file_name,
        file_type: entry.file_type,
        public_url: entry.public_url,
        mime_type: entry.mime_type ?? 'application/octet-stream',
        created_at: entry.created_at,
        source: entry.source ?? 'upload',
      })),
      ...metadataDocuments,
    ];
    const dedupedEvents = new Map<string, (typeof events)[number] & { note?: string | null; actor_name?: string | null; created_at?: string }>();
    for (const event of [...(events ?? []), ...metadataEvents]) {
      dedupedEvents.set(event.id, event);
    }
    const normalizedEvents = [...dedupedEvents.values()];
    const messages = normalizedEvents
      .filter((event) => String(event.event_type ?? '').toLowerCase() === 'note')
      .map((event) => ({
        id: event.id,
        note: event.note,
        actor_name: event.actor_name,
        created_at: event.created_at,
      }));

    const receiptDocument = normalizedDocuments.find((document) => document.file_type === 'receipt_pdf' && document.public_url);
    const pdfAttachment = buildPdfAttachment(data.receipt_url || receiptDocument?.public_url || null);
    const statusLabelMap: Record<string, string> = {
      pending: runtimeConfig.statusLabels.pending ?? 'Recibido',
      pendiente: runtimeConfig.statusLabels.pendiente ?? 'Recibido',
      recibido: runtimeConfig.statusLabels.recibido ?? 'Recibido',
      en_espera_de_refaccion: runtimeConfig.statusLabels.en_espera_de_refaccion ?? 'En espera de refacción',
      diagnostico: runtimeConfig.statusLabels.diagnostico ?? 'Diagnóstico',
      diagnosticado: runtimeConfig.statusLabels.diagnosticado ?? 'Diagnóstico',
      cotizado: runtimeConfig.statusLabels.cotizado ?? 'Cotizado',
      reparacion: runtimeConfig.statusLabels.reparacion ?? 'En reparación',
      reparando: runtimeConfig.statusLabels.reparando ?? 'En reparación',
      listo_para_entrega: runtimeConfig.statusLabels.listo_para_entrega ?? 'Listo para entrega',
      listo: runtimeConfig.statusLabels.listo ?? 'Listo',
      entregado: runtimeConfig.statusLabels.entregado ?? 'Entregado',
    };
    const statusKey = String(data.status ?? '').toLowerCase();
    const workflowStatuses = runtimeConfig.statusOptions.service_orders ?? [];
    const getTimelineStatus = (keys: string[]) => (keys.some((key) => statusKey.includes(key)) ? 'completado' as const : 'actual' as const);
    const workflowLabel = (key: string, fallback: string) => runtimeConfig.statusLabels[key] ?? fallback;
    const timeline = [
      { label: workflowLabel(workflowStatuses[0]?.key ?? 'recibido', 'Recepción'), status: 'completado' as const, note: 'Orden registrada en el sistema.' },
      {
        label: workflowLabel('diagnostico', 'Diagnóstico'),
        status: getTimelineStatus(['diagnostico', 'reparacion', 'listo', 'entregado']),
        note: 'Evaluación técnica del activo o elemento atendido.',
      },
      {
        label: workflowLabel('reparacion', 'En reparación'),
        status: getTimelineStatus(['reparacion', 'listo', 'entregado']),
        note: 'Trabajo operativo en proceso.',
      },
      {
        label: workflowLabel('entregado', 'Entrega'),
        status: ['listo', 'entregado'].includes(statusKey) ? 'actual' as const : 'pendiente' as const,
        note: 'Lista para entregar al cliente.',
      },
    ];

    return res.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding ?? null,
        ...extractContactInfo(tenant.landing_content),
        config: runtimeConfig,
      },
      data: {
        order: data,
        orderStatusLabel: statusLabelMap[statusKey] ?? String(data.status ?? 'Sin estado'),
        timeline,
        pdf_attachment: pdfAttachment,
        attachments: pdfAttachment ? [pdfAttachment] : [],
        documents: normalizedDocuments,
        events: normalizedEvents,
        messages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function getPublicOrderPdf(req: Request, res: Response) {
  const parsed = publicPortalSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, folio } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const supabase = getTenantClient(tenant.id);
    const searchValue = folio.trim();

    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, created_at, updated_at, promised_date, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost, metadata')
      .eq('tenant_id', tenant.id)
      .or(`folio.eq.${searchValue},public_token.eq.${searchValue}`)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'No encontramos una orden con ese folio', details: error?.message });
    }

    const { data: documents, error: documentsError } = await supabase
      .from('service_order_documents')
      .select('id, file_name, file_type, public_url, mime_type, created_at, source')
      .eq('tenant_id', tenant.id)
      .eq('service_order_id', data.id)
      .order('created_at', { ascending: true });

    if (documentsError) {
      return res.status(502).json({ error: 'Failed to load documents', details: documentsError.message });
    }

    const pdfBuffer = await generateOrderPdf({
      tenantName: tenant.name,
      branding: tenant.branding ?? null,
      order: data,
      documents: (documents ?? []).map((entry) => ({
        file_name: entry.file_name,
        file_type: entry.file_type,
        public_url: entry.public_url,
      })),
    });

    return res
      .status(200)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="Seguimiento-${folio}.pdf"`)
      .setHeader('Cache-Control', 'no-store')
      .send(pdfBuffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function getPublicStoreCatalog(req: Request, res: Response) {
  const parsed = publicCatalogSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid params', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const catalog = await loadPublicCatalog(tenant.id);

    return res.json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding ?? null,
        ...extractContactInfo(tenant.landing_content),
        config: runtimeConfig,
      },
      data: {
        catalog,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function createPublicStoreOrder(req: Request, res: Response) {
  const parsed = publicCheckoutSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  try {
    const { tenantSlug, customerName, customerPhone, customerEmail, shippingAddress, city, state, postalCode, notes, items } = parsed.data;
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const supabase = getTenantClient(tenant.id);
    const catalog = await loadPublicCatalog(tenant.id);
    const catalogMap = new Map(catalog.map((product) => [product.id, product]));
    const normalizedItems = items.map((item) => {
      const product = catalogMap.get(item.productId);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }
      const quantity = Math.max(1, Number(item.quantity));
      const unitPrice = Number(product.sale_price ?? 0);
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity,
        unitPrice,
        subtotal: Number((unitPrice * quantity).toFixed(2)),
      };
    });

    const subtotal = Number(normalizedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const shipping = subtotal >= 1200 ? 0 : 149;
    const total = Number((subtotal + shipping).toFixed(2));
    const orderFolio = `DS-${Date.now().toString(36).toUpperCase()}`;
    const publicToken = randomUUID();
    const orderMetadata = {
      channel: 'dropshipping-store',
      shipping_address: shippingAddress,
      city,
      state,
      postal_code: postalCode,
      notes: notes || null,
      items: normalizedItems,
      currency: 'MXN',
      shipping_cost: shipping,
      subtotal,
      total,
    };

    const { data: createdOrder, error: orderError } = await supabase
      .from('service_orders')
      .insert([{
        tenant_id: tenant.id,
        folio: orderFolio,
        public_token: publicToken,
        status: 'recibido',
        device_info: {
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          brand: 'Tienda',
          model: 'Dropshipping',
          type: 'Ecommerce',
        },
        problem_description: `Pedido dropshipping con ${normalizedItems.length} artículo(s)`,
        metadata: orderMetadata,
        estimated_cost: subtotal,
        final_cost: total,
      }])
      .select('id, tenant_id, folio, public_token, status, created_at, estimated_cost, final_cost, metadata')
      .single();

    if (orderError || !createdOrder) {
      return res.status(502).json({ error: 'Failed to create store order', details: orderError?.message ?? 'Unknown error' });
    }

    await supabase.from('service_order_events').insert([{
      id: randomUUID(),
      tenant_id: tenant.id,
      service_order_id: createdOrder.id,
      event_type: 'created',
      previous_status: null,
      new_status: 'recibido',
      note: `Pedido ecommerce creado para ${customerName}`,
      actor_name: 'storefront',
    }]);

    return res.status(201).json({
      success: true,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        branding: tenant.branding ?? null,
        ...extractContactInfo(tenant.landing_content),
      },
      data: {
        order: createdOrder,
        items: normalizedItems,
        shipping,
        subtotal,
        total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (/Producto no encontrado/i.test(message)) {
      return res.status(400).json({ error: message });
    }
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
    return res.status(500).json({ error: message });
  }
}

export async function getPublicTenantLanding(req: Request, res: Response) {
  const tenantSlug = req.params.tenantSlug;

  if (!tenantSlug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const tenant = await resolveTenantIdBySlug(tenantSlug);
    const runtimeConfig = await loadTenantRuntimeConfig(tenant.id);
    const landingContent = mergeLandingContent(tenant.landing_content, (runtimeConfig.templates.landing ?? null) as LandingTemplate | null, tenant.name, tenant.slug);

    return res.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          branding: tenant.branding ?? null,
          ...extractContactInfo(tenant.landing_content),
          config: runtimeConfig,
        },
        landingContent,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (error instanceof Error && error.name === 'TenantNotFoundError') {
      return res.status(404).json({ error: 'No encontramos un tenant con ese slug', details: message });
    }
    return res.status(500).json({ error: message });
  }
}
