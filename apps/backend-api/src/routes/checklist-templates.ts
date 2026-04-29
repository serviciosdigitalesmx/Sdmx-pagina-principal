import { Router } from "express";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

export const checklistTemplatesRouter = Router();

checklistTemplatesRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("checklist_templates")
      .select("id, name, device_type, is_default, created_at")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400, "checklist_template_list_failed");

    const templates = await Promise.all(
      (data ?? []).map(async (template) => {
        const { data: items, error: itemsError } = await supabaseAdmin
          .from("checklist_template_items")
          .select("label, sort_order")
          .eq("template_id", template.id)
          .order("sort_order", { ascending: true });
        if (itemsError) throw new AppError(itemsError.message, 400, "checklist_template_items_failed");
        return { ...template, items: items ?? [] };
      })
    );

    res.json({ templates });
  })
);

checklistTemplatesRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const deviceType = typeof req.body?.deviceType === "string" && req.body.deviceType.trim() ? req.body.deviceType.trim() : null;
    const isDefault = Boolean(req.body?.isDefault);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (name.length < 2) throw new AppError("Template name is required", 422, "template_name_required");
    if (!items.length) throw new AppError("Checklist items are required", 422, "template_items_required");

    const { data: existingDefault, error: defaultError } = await supabaseAdmin
      .from("checklist_templates")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("is_default", true)
      .maybeSingle();
    if (defaultError) throw new AppError(defaultError.message, 400, "template_default_lookup_failed");

    const { data: template, error } = await supabaseAdmin
      .from("checklist_templates")
      .insert({
        tenant_id: tenantId,
        name,
        device_type: deviceType,
        is_default: isDefault || !existingDefault
      })
      .select("id, name, device_type, is_default, created_at")
      .single();
    if (error || !template) throw new AppError(error?.message ?? "Template create failed", 400, "template_create_failed");

    const normalizedItems = items.map((item: { label?: string; sort_order?: number }, index: number) => ({
      template_id: template.id,
      label: typeof item.label === "string" ? item.label.trim() : "",
      sort_order: Number.isInteger(item.sort_order) ? item.sort_order : index
    })).filter((item: { label: string }) => item.label.length > 0);

    if (!normalizedItems.length) throw new AppError("At least one valid item is required", 422, "template_items_required");

    const { error: itemsError } = await supabaseAdmin.from("checklist_template_items").insert(normalizedItems);
    if (itemsError) throw new AppError(itemsError.message, 400, "template_items_create_failed");

    if (isDefault) {
      const { error: resetError } = await supabaseAdmin
        .from("checklist_templates")
        .update({ is_default: false })
        .eq("tenant_id", tenantId)
        .neq("id", template.id);
      if (resetError) throw new AppError(resetError.message, 400, "template_default_reset_failed");
    }

    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "create",
      resourceType: "checklist_template",
      resourceId: template.id,
      metadata: { name, deviceType, isDefault }
    });

    res.status(201).json({ template });
  })
);

checklistTemplatesRouter.patch(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const deviceType = typeof req.body?.deviceType === "string" && req.body.deviceType.trim() ? req.body.deviceType.trim() : null;
    const isDefault = typeof req.body?.isDefault === "boolean" ? req.body.isDefault : undefined;

    const { data: template, error } = await supabaseAdmin
      .from("checklist_templates")
      .update({
        ...(name ? { name } : {}),
        device_type: deviceType,
        ...(typeof isDefault === "boolean" ? { is_default: isDefault } : {})
      })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .select("id, name, device_type, is_default, created_at")
      .single();
    if (error || !template) throw new AppError(error?.message ?? "Template update failed", 400, "template_update_failed");

    if (Array.isArray(req.body?.items)) {
      const existing = await supabaseAdmin
        .from("checklist_template_items")
        .delete()
        .eq("template_id", template.id);
      if (existing.error) throw new AppError(existing.error.message, 400, "template_items_reset_failed");

      const normalizedItems = req.body.items
        .map((item: { label?: string; sort_order?: number }, index: number) => ({
          template_id: template.id,
          label: typeof item.label === "string" ? item.label.trim() : "",
          sort_order: Number.isInteger(item.sort_order) ? item.sort_order : index
        }))
        .filter((item: { label: string }) => item.label.length > 0);
      if (!normalizedItems.length) throw new AppError("At least one valid item is required", 422, "template_items_required");
      const { error: itemsError } = await supabaseAdmin.from("checklist_template_items").insert(normalizedItems);
      if (itemsError) throw new AppError(itemsError.message, 400, "template_items_update_failed");
    }

    if (isDefault) {
      const { error: resetError } = await supabaseAdmin
        .from("checklist_templates")
        .update({ is_default: false })
        .eq("tenant_id", tenantId)
        .neq("id", template.id);
      if (resetError) throw new AppError(resetError.message, 400, "template_default_reset_failed");
    }

    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "update",
      resourceType: "checklist_template",
      resourceId: template.id,
      metadata: { name: template.name, device_type: template.device_type, is_default: template.is_default }
    });

    res.json({ template });
  })
);
