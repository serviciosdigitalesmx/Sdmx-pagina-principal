import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const supplierSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional()
});

export const suppliersRouter = Router();

suppliersRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("suppliers"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .select("id, name, contact_name, phone, email, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new AppError(error.message, 400, "supplier_list_failed");
    res.json({ suppliers: data });
  })
);

suppliersRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("suppliers"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = supplierSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert({
        tenant_id: tenantId,
        name: body.name,
        contact_name: body.contactName ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null
      })
      .select("id, name, contact_name, phone, email, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "supplier_create_failed");
    res.status(201).json({ supplier: data });
  })
);
