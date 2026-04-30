import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { buildOrderPdfBuffer } from "../core/order-pdf.js";
import { storeOrderDocument } from "../core/order-documents.js";
import { buildWhatsAppUrl } from "../core/whatsapp.js";
import { env } from "../core/env.js";
import { supabaseAdmin } from "../core/supabase.js";

export const publicRouter = Router();

const publicQuoteSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  vehiclePlate: z.string().min(2),
  description: z.string().min(3),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  accessories: z.string().optional(),
  checklistTemplateId: z.string().uuid().optional()
});

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "Abierta",
    in_progress: "En progreso",
    waiting_parts: "Esperando refacción",
    done: "Lista",
    canceled: "Cancelada"
  };
  return labels[status] ?? status;
}

function tenantKeyFromHost(host?: string | null) {
  if (!host) return null;
  const normalized = (host ?? "").split(":").at(0)?.toLowerCase() ?? "";
  if (normalized === "localhost" || normalized === "127.0.0.1") return null;
  const parts = normalized.split(".");
  if (parts.length < 3) return null;
  const [subdomain] = parts;
  if (!subdomain || subdomain === "www") return null;
  return subdomain;
}

function normalizeSettingsRow(settingsRow: Record<string, unknown>, fallbackName: string) {
  return {
    website_title: typeof settingsRow.website_title === "string" ? settingsRow.website_title : fallbackName,
    website_subtitle: typeof settingsRow.website_subtitle === "string" ? settingsRow.website_subtitle : "Recepción, diagnóstico y seguimiento en línea.",
    description: typeof settingsRow.description === "string" ? settingsRow.description : "",
    portal_title: typeof settingsRow.portal_title === "string" ? settingsRow.portal_title : "Rastreo de Orden",
    portal_subtitle: typeof settingsRow.portal_subtitle === "string" ? settingsRow.portal_subtitle : "Consulta pública por folio.",
    portal_description: typeof settingsRow.portal_description === "string" ? settingsRow.portal_description : "",
    services: Array.isArray(settingsRow.services) ? settingsRow.services : [],
    contact_phone: typeof settingsRow.contact_phone === "string" ? settingsRow.contact_phone : "",
    whatsapp_phone: typeof settingsRow.whatsapp_phone === "string" ? settingsRow.whatsapp_phone : "",
    logo_url: typeof settingsRow.logo_url === "string" ? settingsRow.logo_url : "",
    primary_color: typeof settingsRow.primary_color === "string" ? settingsRow.primary_color : "#1F7EDC",
    secondary_color: typeof settingsRow.secondary_color === "string" ? settingsRow.secondary_color : "#FF6A2A",
    website_cta: typeof settingsRow.website_cta === "string" ? settingsRow.website_cta : "Cotizar ahora",
    pdf_ingreso_title: typeof settingsRow.pdf_ingreso_title === "string" ? settingsRow.pdf_ingreso_title : "Orden de ingreso",
    pdf_diagnostico_title: typeof settingsRow.pdf_diagnostico_title === "string" ? settingsRow.pdf_diagnostico_title : "Informe de diagnóstico",
    pdf_presupuesto_title: typeof settingsRow.pdf_presupuesto_title === "string" ? settingsRow.pdf_presupuesto_title : "Presupuesto del servicio",
    pdf_entrega_title: typeof settingsRow.pdf_entrega_title === "string" ? settingsRow.pdf_entrega_title : "Confirmación de entrega",
    pdf_footer_note: typeof settingsRow.pdf_footer_note === "string" ? settingsRow.pdf_footer_note : "Gracias por confiar en tu taller.",
    address: typeof settingsRow.address === "string" ? settingsRow.address : "",
    email: typeof settingsRow.email === "string" ? settingsRow.email : ""
  };
}

async function resolvePublicTenant(req: Request) {
  const slug = typeof req.params.slug === "string" && req.params.slug.trim() ? req.params.slug.trim() : null;
  const querySlug = typeof req.query.slug === "string" && req.query.slug.trim() ? req.query.slug.trim() : null;
  const headerHost = typeof req.query.host === "string" && req.query.host.trim() ? req.query.host.trim() : req.header("x-tenant-host");
  const hostSlug = tenantKeyFromHost(headerHost ?? req.hostname);
  const resolvedSlug = slug ?? querySlug ?? hostSlug;

  if (!resolvedSlug) {
    throw new AppError("Tenant identifier required", 422, "tenant_identifier_required");
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug, tenant_settings(website_title, website_subtitle, description, portal_title, portal_subtitle, portal_description, services, contact_phone, whatsapp_phone, logo_url, primary_color, secondary_color, website_cta, pdf_ingreso_title, pdf_diagnostico_title, pdf_presupuesto_title, pdf_entrega_title, pdf_footer_note, address, email)")
    .eq("slug", resolvedSlug)
    .maybeSingle();

  if (error) throw new AppError(error.message, 400, "tenant_lookup_failed");
  if (!data) throw new AppError("Tenant not found", 404, "tenant_not_found");

  const tenantSettings = (data as { tenant_settings?: Array<Record<string, unknown>> | Record<string, unknown> | null }).tenant_settings;
  const settingsRow = Array.isArray(tenantSettings) ? tenantSettings[0] ?? {} : tenantSettings ?? {};

  return {
    tenant: {
      id: data.id,
      name: data.name,
      slug: data.slug
    },
    settings: normalizeSettingsRow(settingsRow as Record<string, unknown>, data.name)
  };
}

publicRouter.get(
  "/tenant",
  asyncHandler(async (req, res) => {
    const payload = await resolvePublicTenant(req);
    res.json(payload);
  })
);

publicRouter.get(
  "/tenant/:slug",
  asyncHandler(async (req, res) => {
    const payload = await resolvePublicTenant(req);
    res.json(payload);
  })
);

publicRouter.post(
  "/tenant/:slug/orders",
  asyncHandler(async (req, res) => {
    const payload = await resolvePublicTenant(req);
    const body = publicQuoteSchema.parse(req.body);

    const tenantId = payload.tenant.id;
    let customerId: string;
    const byPhone = body.phone
      ? await supabaseAdmin.from("customers").select("id").eq("tenant_id", tenantId).eq("phone", body.phone).maybeSingle()
      : { data: null, error: null };
    const byEmail = !byPhone.data && body.email
      ? await supabaseAdmin.from("customers").select("id").eq("tenant_id", tenantId).eq("email", body.email).maybeSingle()
      : { data: null, error: null };

    if (byPhone.error) throw new AppError(byPhone.error.message, 400, "customer_lookup_failed");
    if (byEmail.error) throw new AppError(byEmail.error.message, 400, "customer_lookup_failed");

    if (byPhone.data?.id) {
      customerId = byPhone.data.id;
    } else if (byEmail.data?.id) {
      customerId = byEmail.data.id;
    } else {
      const { data: createdCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          tenant_id: tenantId,
          full_name: body.fullName,
          phone: body.phone ?? null,
          email: body.email ?? null,
          address: null
        })
        .select("id")
        .single();
      if (customerError || !createdCustomer) throw new AppError(customerError?.message ?? "Customer create failed", 400, "customer_create_failed");
      customerId = createdCustomer.id;
    }

    const { data: sequence, error: sequenceError } = await supabaseAdmin.rpc("increment_repair_sequence", { p_tenant_id: tenantId });
    if (sequenceError) throw new AppError(sequenceError.message, 500, "folio_sequence_failed");
    const folio = `EQ-${String(sequence).padStart(5, "0")}`;

    const { data: template } = body.checklistTemplateId
      ? await supabaseAdmin.from("checklist_templates").select("id").eq("tenant_id", tenantId).eq("id", body.checklistTemplateId).maybeSingle()
      : await supabaseAdmin.from("checklist_templates").select("id").eq("tenant_id", tenantId).eq("is_default", true).maybeSingle();

    const { data: order, error: orderError } = await supabaseAdmin
      .from("service_orders")
      .insert({
        tenant_id: tenantId,
        folio,
        customer_id: customerId,
        checklist_template_id: template?.id ?? null,
        device_type: body.deviceType ?? null,
        device_brand: body.deviceBrand ?? null,
        device_model: body.deviceModel ?? null,
        accessories: body.accessories ?? null,
        vehicle_plate: body.vehiclePlate,
        description: body.description,
        reported_failure: body.description,
        status: "open"
      })
      .select("id, folio, customer_id, vehicle_plate, description, status, created_at")
      .single();

    if (orderError || !order) throw new AppError(orderError?.message ?? "order_create_failed", 400, "order_create_failed");

    const portalUrl = env.NEXT_PUBLIC_APP_URL ? `${env.NEXT_PUBLIC_APP_URL}/portal?folio=${folio}` : `/portal?folio=${folio}`;
    const whatsappMessage = `Hola ${body.fullName}, ya registramos tu solicitud ${folio}. Puedes seguirla aquí: ${portalUrl}`;
    const whatsappUrl = buildWhatsAppUrl({ phone: body.phone ?? null, message: whatsappMessage });

    await supabaseAdmin.from("order_events").insert({
      tenant_id: tenantId,
      order_id: order.id,
      event_type: "public_quote_created",
      title: "Solicitud creada desde web pública",
      description: `Se generó ${folio} desde la web del tenant`,
      metadata: { portal_url: portalUrl, whatsapp_url: whatsappUrl, public: true },
      created_by: null
    });

    if (template?.id) {
      const { data: templateItems } = await supabaseAdmin
        .from("checklist_template_items")
        .select("label, sort_order")
        .eq("template_id", template.id)
        .order("sort_order", { ascending: true });
      if (templateItems?.length) {
        await supabaseAdmin.from("order_checklist_items").insert(
          templateItems.map((item) => ({
            tenant_id: tenantId,
            order_id: order.id,
            label: item.label,
            checked: false,
            sort_order: item.sort_order
          }))
        );
      }
    }

    await supabaseAdmin.from("audit_events").insert({
      tenant_id: tenantId,
      actor_user_id: null,
      action: "public_quote_created",
      resource_type: "service_order",
      resource_id: order.id,
      metadata: {
        folio,
        source: "tenant_website"
      }
    });

    res.status(201).json({
      order: { ...order, customer_id: customerId },
      folio,
      portal_url: portalUrl,
      whatsapp_url: whatsappUrl
    });
  })
);

publicRouter.get(
  "/repair-orders/:folio",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("service_orders")
      .select("id, tenant_id, folio, vehicle_plate, status, reported_failure, diagnosis, public_notes, photos_urls, created_at, promised_date, completion_date, delivery_date, customer:customers(full_name, phone)")
      .eq("folio", req.params.folio)
      .single();

    if (error || !data) throw new AppError("Order not found", 404, "order_not_found");
    const { data: checklistItems } = await supabaseAdmin
      .from("order_checklist_items")
      .select("label, checked, sort_order")
      .eq("order_id", data.id)
      .order("sort_order", { ascending: true });
    const { data: events } = await supabaseAdmin
      .from("order_events")
      .select("id, event_type, title, description, metadata, created_at")
      .eq("tenant_id", data.tenant_id)
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    const { data: documents } = await supabaseAdmin
      .from("order_documents")
      .select("document_type, public_url, created_at")
      .eq("tenant_id", data.tenant_id)
      .eq("order_id", data.id)
      .order("created_at", { ascending: false });
    const tenantSettingsRow = Array.isArray((data as { tenant?: { tenant_settings?: Array<Record<string, unknown>> | Record<string, unknown> | null } }).tenant?.tenant_settings)
      ? ((data as { tenant?: { tenant_settings?: Array<Record<string, unknown>> } }).tenant?.tenant_settings?.[0] ?? {})
      : ((data as { tenant?: { tenant_settings?: Record<string, unknown> | null } }).tenant?.tenant_settings ?? {});
    res.json({
      ...data,
      checklist_items: checklistItems ?? [],
      events: events ?? [],
      documents: documents ?? [],
      status_label: statusLabel(data.status),
      settings: normalizeSettingsRow(tenantSettingsRow as Record<string, unknown>, (data as { tenant?: { name?: string } }).tenant?.name ?? "Taller")
    });
  })
);

publicRouter.get(
  "/repair-orders/:folio/pdf",
  asyncHandler(async (req, res) => {
    const kind = req.query.kind === "diagnostico" || req.query.kind === "presupuesto" || req.query.kind === "entrega" ? req.query.kind : "ingreso";
    const { data: order, error } = await supabaseAdmin
      .from("service_orders")
      .select("id, tenant_id, folio, status, vehicle_plate, device_type, device_brand, device_model, accessories, reported_failure, diagnosis, internal_notes, public_notes, estimated_cost, final_cost, payment_registered, promised_date, completion_date, delivery_date, photos_urls, created_at, customer:customers(full_name, phone), tenant:tenants(id, name, slug, tenant_settings(website_title, website_subtitle, description, portal_title, portal_subtitle, portal_description, services, contact_phone, whatsapp_phone, logo_url, primary_color, secondary_color, website_cta, pdf_ingreso_title, pdf_diagnostico_title, pdf_presupuesto_title, pdf_entrega_title, pdf_footer_note, address, email))")
      .eq("folio", req.params.folio)
      .single();

    if (error || !order) throw new AppError("Order not found", 404, "order_not_found");
    const { data: checklistItems } = await supabaseAdmin
      .from("order_checklist_items")
      .select("label, checked, sort_order")
      .eq("order_id", order.id)
      .order("sort_order", { ascending: true });
    const tenantSettingsRow = Array.isArray((order as { tenant?: { tenant_settings?: unknown[] } }).tenant?.tenant_settings)
      ? ((order as { tenant?: { tenant_settings?: Array<Record<string, unknown>> } }).tenant?.tenant_settings?.[0] ?? {})
      : ((order as { tenant?: { tenant_settings?: Record<string, unknown> | null } }).tenant?.tenant_settings ?? {});

    const rawCustomer = (order as { customer?: { full_name?: string | null; phone?: string | null }[] | { full_name?: string | null; phone?: string | null } | null }).customer;
    const pdfOrder = {
      folio: order.folio,
      status: order.status,
      vehicle_plate: order.vehicle_plate,
      device_type: order.device_type,
      device_brand: order.device_brand,
      device_model: order.device_model,
      accessories: order.accessories,
      reported_failure: order.reported_failure,
      diagnosis: order.diagnosis,
      internal_notes: order.internal_notes,
      public_notes: order.public_notes,
      estimated_cost: order.estimated_cost,
      final_cost: order.final_cost,
      payment_registered: order.payment_registered,
      promised_date: order.promised_date,
      completion_date: order.completion_date,
      delivery_date: order.delivery_date,
      photos_urls: order.photos_urls,
      created_at: order.created_at,
      ...(rawCustomer
        ? {
            customer: Array.isArray(rawCustomer) ? rawCustomer[0] : rawCustomer
          }
        : {})
    };

    const buffer = await buildOrderPdfBuffer(
      pdfOrder,
      checklistItems ?? [],
      kind,
      normalizeSettingsRow(tenantSettingsRow as Record<string, unknown>, (order as { tenant?: { name?: string } }).tenant?.name ?? "Taller")
    );
    await storeOrderDocument({
      tenantId: order.tenant_id,
      orderId: order.id,
      folio: order.folio,
      documentType: kind,
      pdfBuffer: buffer
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=orden-${order.folio}-${kind}.pdf`);
    res.send(buffer);
  })
);
