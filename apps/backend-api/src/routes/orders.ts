import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { env } from "../core/env.js";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { buildOrderStatusMessage, buildWhatsAppUrl } from "../core/whatsapp.js";
import { compressEvidenceImage } from "../core/image.js";
import { assertStorageQuota, addStorageUsage } from "../core/storage-quota.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  vehiclePlate: z.string().min(2),
  description: z.string().min(3),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  accessories: z.string().optional(),
  checklistTemplateId: z.string().uuid().optional()
});

const updateOrderSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_parts", "done", "canceled"]).optional(),
  reportedFailure: z.string().optional(),
  diagnosis: z.string().optional(),
  internalNotes: z.string().optional(),
  publicNotes: z.string().optional(),
  estimatedCost: z.number().nonnegative().optional(),
  finalCost: z.number().nonnegative().optional(),
  technicianId: z.string().uuid().optional().nullable(),
  promisedDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  paymentRegistered: z.boolean().optional(),
  vehiclePlate: z.string().min(2).optional(),
  checklistItems: z.array(
    z.object({
      id: z.string().uuid().optional(),
      label: z.string().min(1),
      checked: z.boolean().optional(),
      sortOrder: z.number().int().nonnegative().optional()
    })
  ).optional()
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

type OrderStatusRow = {
  id: string;
  folio: string;
  status: string;
  customer: { phone?: string | null } | null;
};

export const ordersRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });
const evidenceBucket = env.EVIDENCE_IMAGES_BUCKET ?? "evidence-images";

ordersRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const body = createOrderSchema.parse(req.body);
    const tenantId = req.context!.tenantId;
    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("id, full_name, phone")
      .eq("tenant_id", tenantId)
      .eq("id", body.customerId)
      .single();
    if (customerError || !customer) throw new AppError("Customer not found", 404, "customer_not_found");

    const { data: sequence, error: sequenceError } = await supabaseAdmin.rpc("increment_repair_sequence", {
      p_tenant_id: tenantId
    });
    if (sequenceError) throw new AppError(sequenceError.message, 500, "folio_sequence_failed");
    const folio = `EQ-${String(sequence).padStart(5, "0")}`;

    const { data: template } = body.checklistTemplateId
      ? await supabaseAdmin
          .from("checklist_templates")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("id", body.checklistTemplateId)
          .maybeSingle()
      : await supabaseAdmin
          .from("checklist_templates")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("is_default", true)
          .maybeSingle();

    const { error, data } = await supabaseAdmin
      .from("service_orders")
      .insert({
        tenant_id: tenantId,
        folio,
        customer_id: body.customerId,
        checklist_template_id: template?.id ?? null,
        device_type: body.deviceType ?? null,
        device_brand: body.deviceBrand ?? null,
        device_model: body.deviceModel ?? null,
        accessories: body.accessories ?? null,
        vehicle_plate: body.vehiclePlate,
        description: body.description,
        status: "open"
      })
      .select("id, tenant_id, customer_id, vehicle_plate, description, status, created_at")
      .single();

    if (error) throw new AppError(error.message, 400, "order_create_failed");

    const initialNotificationMessage = `Hola ${customer.full_name}, ya registramos tu orden ${folio}. Puedes dar seguimiento aquí: ${env.NEXT_PUBLIC_APP_URL ?? ""}/consultar?folio=${folio}`;
    await supabaseAdmin.from("order_events").insert({
      tenant_id: tenantId,
      order_id: data.id,
      event_type: "created",
      title: "Orden creada",
      description: `Se generó ${folio}`,
      metadata: {
        portal_url: `${env.NEXT_PUBLIC_APP_URL ?? ""}/consultar?folio=${folio}`,
        whatsapp_url: buildWhatsAppUrl({ phone: customer.phone, message: initialNotificationMessage }),
        message: initialNotificationMessage
      },
      created_by: req.context!.userId
    });

    if (template?.id) {
      const { data: templateItems, error: templateItemsError } = await supabaseAdmin
        .from("checklist_template_items")
        .select("label, sort_order")
        .eq("template_id", template.id)
        .order("sort_order", { ascending: true });
      if (templateItemsError) throw new AppError(templateItemsError.message, 500, "checklist_template_failed");
      if (templateItems?.length) {
        const items = templateItems.map((item) => ({
          tenant_id: tenantId,
          order_id: data.id,
          label: item.label,
          checked: false,
          sort_order: item.sort_order
        }));
        const { error: checklistError } = await supabaseAdmin.from("order_checklist_items").insert(items);
        if (checklistError) throw new AppError(checklistError.message, 500, "checklist_create_failed");
      }
    }

    const { error: usageError } = await supabaseAdmin.rpc("increment_usage_counter", {
      p_tenant_id: tenantId
    });
    if (usageError) throw new AppError(usageError.message, 500, "usage_increment_failed");

    void logAuditEvent({
      tenantId,
      actorUserId: req.context!.userId,
      action: "create",
      resourceType: "service_order",
      resourceId: data.id,
      metadata: {
        folio,
        customer_id: body.customerId,
        vehicle_plate: body.vehiclePlate
      }
    });

    if (!env.NEXT_PUBLIC_APP_URL) throw new AppError("NEXT_PUBLIC_APP_URL is required", 500, "missing_app_url");
    const portalUrl = `${env.NEXT_PUBLIC_APP_URL}/consultar?folio=${folio}`;
    const whatsappUrl = buildWhatsAppUrl({ phone: customer.phone, message: initialNotificationMessage });
    await supabaseAdmin
      .from("order_events")
      .update({
        metadata: {
          portal_url: portalUrl,
          whatsapp_url: whatsappUrl,
          message: initialNotificationMessage
        }
      })
      .eq("tenant_id", tenantId)
      .eq("order_id", data.id)
      .eq("event_type", "created");

    res.status(201).json({
      order: data,
      folio,
      portal_url: portalUrl,
      customer: { id: customer.id, full_name: customer.full_name, phone: customer.phone },
      whatsapp_url: whatsappUrl
    });
  })
);

ordersRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;

    const { data, error } = await supabaseAdmin
      .from("service_orders")
      .select("id, folio, tenant_id, customer_id, vehicle_plate, description, status, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 400, "order_list_failed");

    res.json({ orders: data });
  })
);

ordersRouter.get(
  "/:folio",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("service_orders")
      .select(
        "id, folio, customer_id, customer:customers(id, full_name, phone, email, address), checklist_template_id, device_type, device_brand, device_model, accessories, vehicle_plate, reported_failure, diagnosis, internal_notes, public_notes, estimated_cost, final_cost, technician_id, promised_date, completion_date, delivery_date, payment_registered, photos_urls, status, created_at, updated_at"
      )
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .single();

    if (error || !data) throw new AppError("Order not found", 404, "order_not_found");
    const { data: checklistItems } = await supabaseAdmin
      .from("order_checklist_items")
      .select("id, label, checked, sort_order")
      .eq("tenant_id", tenantId)
      .eq("order_id", data.id)
      .order("sort_order", { ascending: true });

    res.json({ order: { ...data, checklist_items: checklistItems ?? [] } });
  })
);

ordersRouter.patch(
  "/:folio",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = updateOrderSchema.parse(req.body);
    const { data: order, error: orderError } = await supabaseAdmin
      .from("service_orders")
      .select("id, folio, status, customer:customers(phone)")
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .single();
    if (orderError || !order) throw new AppError("Order not found", 404, "order_not_found");

    const { data, error } = await supabaseAdmin
      .from("service_orders")
      .update({
        status: body.status,
        reported_failure: body.reportedFailure,
        diagnosis: body.diagnosis,
        internal_notes: body.internalNotes,
        public_notes: body.publicNotes,
        estimated_cost: body.estimatedCost,
        final_cost: body.finalCost,
        technician_id: body.technicianId,
        promised_date: body.promisedDate || null,
        completion_date: body.completionDate || null,
        delivery_date: body.deliveryDate || null,
        payment_registered: body.paymentRegistered,
        vehicle_plate: body.vehiclePlate,
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .select(
        "id, folio, customer_id, device_type, device_brand, device_model, accessories, vehicle_plate, reported_failure, diagnosis, internal_notes, public_notes, estimated_cost, final_cost, technician_id, promised_date, completion_date, delivery_date, payment_registered, photos_urls, status, created_at, updated_at"
      )
      .single();

    if (error || !data) throw new AppError("Order update failed", 400, "order_update_failed");

    if (body.checklistItems) {
      const { error: deleteError } = await supabaseAdmin
        .from("order_checklist_items")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("order_id", data.id);
      if (deleteError) throw new AppError(deleteError.message, 500, "checklist_reset_failed");

      if (body.checklistItems.length) {
        const items = body.checklistItems.map((item, index) => ({
          tenant_id: tenantId,
          order_id: data.id,
          label: item.label,
          checked: item.checked ?? false,
          sort_order: item.sortOrder ?? index
        }));
        const { error: insertError } = await supabaseAdmin.from("order_checklist_items").insert(items);
        if (insertError) throw new AppError(insertError.message, 500, "checklist_update_failed");
      }
    }

    const { data: checklistItems } = await supabaseAdmin
      .from("order_checklist_items")
      .select("id, label, checked, sort_order")
      .eq("tenant_id", tenantId)
      .eq("order_id", data.id)
      .order("sort_order", { ascending: true });

    const previousStatus = order.status as string;
    const statusChanged = typeof body.status === "string" && body.status !== previousStatus;
    const folio = String(req.params.folio);
    const portalUrl = env.NEXT_PUBLIC_APP_URL ? `${env.NEXT_PUBLIC_APP_URL}/consultar?folio=${folio}` : "";
    const statusMessage = buildOrderStatusMessage(folio, portalUrl, statusLabel(body.status ?? data.status));
    const statusWhatsAppUrl = buildWhatsAppUrl({
      phone: (order as OrderStatusRow).customer?.phone ?? null,
      message: statusMessage
    });

    await supabaseAdmin.from("order_events").insert({
      tenant_id: tenantId,
      order_id: data.id,
      event_type: statusChanged ? "status_changed" : "updated",
      title: statusChanged ? "Estado actualizado" : "Orden actualizada",
      description: statusChanged
        ? `Estado: ${previousStatus} → ${body.status}`
        : `Se actualizó ${req.params.folio}`,
      metadata: statusChanged
        ? {
            previous_status: previousStatus,
            next_status: body.status,
            whatsapp_url: statusWhatsAppUrl,
            message: statusMessage,
            portal_url: portalUrl
          }
        : {
            whatsapp_url: statusWhatsAppUrl,
            message: statusMessage,
            portal_url: portalUrl
          },
      created_by: req.context!.userId
    });

    void logAuditEvent({
      tenantId,
      actorUserId: req.context!.userId,
      action: "update",
      resourceType: "service_order",
      resourceId: data.id,
      metadata: {
        folio: req.params.folio,
        status: body.status,
        payment_registered: body.paymentRegistered
      }
    });

    res.json({
      order: { ...data, checklist_items: checklistItems ?? [] },
      notification: {
        whatsapp_url: statusWhatsAppUrl,
        message: statusMessage,
        status_changed: statusChanged
      }
    });
  })
);

ordersRouter.post(
  "/:folio/photos",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  upload.array("photos", 5),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files?.length) throw new AppError("No photos provided", 422, "photos_required");

    const { data: currentOrder, error: orderError } = await supabaseAdmin
      .from("service_orders")
      .select("id, photos_urls")
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .single();

    if (orderError || !currentOrder) throw new AppError("Order not found", 404, "order_not_found");

    const existing = Array.isArray(currentOrder.photos_urls) ? currentOrder.photos_urls : [];
    const uploaded: string[] = [];
    const processedFiles = [];

    for (const file of files) {
      const compressed = await compressEvidenceImage(file.buffer);
      processedFiles.push({
        originalName: file.originalname,
        buffer: compressed.buffer,
        mimeType: compressed.mimeType,
        bytes: compressed.bytes,
        extension: compressed.extension
      });
    }

    const totalBytes = processedFiles.reduce((sum, file) => sum + file.bytes, 0);
    await assertStorageQuota(tenantId, totalBytes);

    for (const file of processedFiles) {
      const fileName = `${tenantId}/${req.params.folio}/${Date.now()}-${file.originalName.replace(/[^a-z0-9._-]+/gi, "-")}.${file.extension}`;
      const { error: uploadError } = await supabaseAdmin.storage.from(evidenceBucket).upload(fileName, file.buffer, {
        contentType: file.mimeType,
        upsert: false
      });
      if (uploadError) throw new AppError(uploadError.message, 500, "photo_upload_failed");

      const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage.from(evidenceBucket).createSignedUrl(fileName, 60 * 60 * 24 * 30);
      if (signedUrlError) throw new AppError(signedUrlError.message, 500, "photo_sign_failed");
      uploaded.push(signedUrl.signedUrl);
    }

    await addStorageUsage(tenantId, totalBytes);

    const merged = [...existing, ...uploaded];
    const { error: updateError } = await supabaseAdmin
      .from("service_orders")
      .update({ photos_urls: merged, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio);
    if (updateError) throw new AppError(updateError.message, 500, "photo_link_update_failed");

    await supabaseAdmin.from("order_events").insert({
      tenant_id: tenantId,
      order_id: currentOrder.id,
      event_type: "photo_added",
      title: "Foto agregada",
      description: `Se subieron ${uploaded.length} fotos`,
      metadata: { uploaded_urls: uploaded },
      created_by: req.context!.userId
    });

    void logAuditEvent({
      tenantId,
      actorUserId: req.context!.userId,
      action: "upload",
      resourceType: "service_order_photo",
      resourceId: currentOrder.id,
      metadata: {
        folio: req.params.folio,
        uploaded_count: uploaded.length
      }
    });

    res.status(201).json({ photos: uploaded, photos_urls: merged });
  })
);

ordersRouter.get(
  "/:folio/events",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data: order, error: orderError } = await supabaseAdmin
      .from("service_orders")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("folio", req.params.folio)
      .single();
    if (orderError || !order) throw new AppError("Order not found", 404, "order_not_found");

    const { data, error } = await supabaseAdmin
      .from("order_events")
      .select("id, event_type, title, description, metadata, created_at")
      .eq("tenant_id", tenantId)
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });

    if (error) throw new AppError(error.message, 400, "order_events_failed");
    res.json({ events: data ?? [] });
  })
);
