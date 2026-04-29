import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";

const updateTenantSettingsSchema = z.object({
  websiteTitle: z.string().optional(),
  websiteSubtitle: z.string().optional(),
  description: z.string().optional(),
  portalTitle: z.string().optional(),
  portalSubtitle: z.string().optional(),
  portalDescription: z.string().optional(),
  services: z.array(z.object({
    label: z.string().min(1),
    description: z.string().optional()
  })).optional(),
  contactPhone: z.string().optional(),
  whatsappPhone: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  websiteCta: z.string().optional(),
  pdfIngresoTitle: z.string().optional(),
  pdfDiagnosticoTitle: z.string().optional(),
  pdfPresupuestoTitle: z.string().optional(),
  pdfEntregaTitle: z.string().optional(),
  pdfFooterNote: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional()
});

export const tenantSettingsRouter = Router();

tenantSettingsRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw new AppError(error.message, 400, "tenant_settings_failed");
    res.json({ settings: data ?? null });
  })
);

tenantSettingsRouter.put(
  "/",
  requireAuth,
  requireActiveSubscription,
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = updateTenantSettingsSchema.parse(req.body);
    const services = body.services?.map((service) => ({
      label: service.label,
      description: service.description ?? ""
    }));

    const { data, error } = await supabaseAdmin
      .from("tenant_settings")
      .upsert(
        {
          tenant_id: tenantId,
          website_title: body.websiteTitle ?? null,
          website_subtitle: body.websiteSubtitle ?? null,
          description: body.description ?? null,
          portal_title: body.portalTitle ?? null,
          portal_subtitle: body.portalSubtitle ?? null,
          portal_description: body.portalDescription ?? null,
          services: services ?? null,
          contact_phone: body.contactPhone ?? null,
          whatsapp_phone: body.whatsappPhone ?? null,
          logo_url: body.logoUrl ?? null,
          primary_color: body.primaryColor ?? null,
          secondary_color: body.secondaryColor ?? null,
          website_cta: body.websiteCta ?? null,
          pdf_ingreso_title: body.pdfIngresoTitle ?? null,
          pdf_diagnostico_title: body.pdfDiagnosticoTitle ?? null,
          pdf_presupuesto_title: body.pdfPresupuestoTitle ?? null,
          pdf_entrega_title: body.pdfEntregaTitle ?? null,
          pdf_footer_note: body.pdfFooterNote ?? null,
          address: body.address ?? null,
          email: body.email ?? null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "tenant_id" }
      )
      .select("*")
      .single();

    if (error) throw new AppError(error.message, 400, "tenant_settings_update_failed");

    await logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "tenant_settings_update",
      resourceType: "tenant_settings",
      resourceId: tenantId,
      metadata: { website_title: data.website_title, portal_title: data.portal_title }
    });

    res.json({ settings: data });
  })
);
