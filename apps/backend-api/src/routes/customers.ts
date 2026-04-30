import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const customerSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

export const customersRouter = Router();

customersRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("customers"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("customers")
      .select("id, full_name, phone, email, address, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400, "customer_list_failed");
    res.json({ customers: data });
  })
);

customersRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("customers"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = customerSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("customers")
      .insert({
        tenant_id: tenantId,
        full_name: body.fullName,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null
      })
      .select("id, full_name, phone, email, address, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "customer_create_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "create",
      resourceType: "customer",
      resourceId: data.id,
      metadata: { full_name: data.full_name }
    });
    res.status(201).json({ customer: data });
  })
);

customersRouter.patch(
  "/:id",
  requireAuth,
  requireActiveSubscription,
  requireFeature("customers"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = customerSchema.partial().parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("customers")
      .update({
        full_name: body.fullName,
        phone: body.phone,
        email: body.email,
        address: body.address
      })
      .eq("tenant_id", tenantId)
      .eq("id", req.params.id)
      .select("id, full_name, phone, email, address, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "customer_update_failed");
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "update",
      resourceType: "customer",
      resourceId: data.id,
      metadata: { full_name: data.full_name }
    });
    res.json({ customer: data });
  })
);
