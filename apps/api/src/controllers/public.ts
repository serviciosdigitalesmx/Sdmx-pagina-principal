import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient, supabaseAdmin } from '@white-label/database';
import { loadTenantRuntimeConfig } from '../services/tenant-config';

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

async function resolveTenantIdBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug, name, branding, landing_content')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Tenant not found');
  }

  return data;
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
    const requestMetadata = {
      ...metadata,
      device_type: deviceType || deviceBrand,
      device_brand: deviceBrand,
      device_model: deviceModel,
      serial_number: serialNumber || null,
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
          issue_description: issue,
          metadata: requestMetadata,
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
      .select('id, tenant_id, folio, status, total_cost, created_at, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost, metadata')
      .eq('tenant_id', tenant.id)
      .eq('folio', folio)
      .single();

    if (error) {
      return res.status(404).json({ error: 'No encontramos tu reparación', details: error.message });
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

    const { data, error } = await supabase
      .from('service_orders')
      .select('id, tenant_id, folio, status, total_cost, created_at, device_info, problem_description, serial_number, receipt_url, estimated_cost, final_cost, evidence_metadata, metadata')
      .eq('tenant_id', tenant.id)
      .eq('folio', folio)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'No encontramos tu reparación', details: error?.message });
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

    const evidenceMetadata = Array.isArray(data.evidence_metadata) ? data.evidence_metadata : [];
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
      diagnostico: runtimeConfig.statusLabels.diagnostico ?? 'Diagnóstico',
      diagnosticado: runtimeConfig.statusLabels.diagnosticado ?? 'Diagnóstico',
      reparacion: runtimeConfig.statusLabels.reparacion ?? 'En reparación',
      reparando: runtimeConfig.statusLabels.reparando ?? 'En reparación',
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
    return res.status(500).json({ error: message });
  }
}
