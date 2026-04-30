import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

const technicianSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional()
});

export const techniciansRouter = Router();

techniciansRouter.get(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const [techniciansResult, ordersResult] = await Promise.all([
      supabaseAdmin
      .from("technicians")
      .select("id, full_name, phone, email, active, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("service_orders")
        .select("technician_id, status")
        .eq("tenant_id", tenantId)
    ]);

    const { data, error } = techniciansResult;
    const { data: orders, error: ordersError } = ordersResult;
    if (error) throw new AppError(error.message, 400, "technician_list_failed");
    if (ordersError) throw new AppError(ordersError.message, 400, "technician_metrics_failed");

    const technicianStats = new Map<string, { total: number; open: number; inProgress: number; done: number; waitingParts: number }>();
    for (const order of orders ?? []) {
      if (!order.technician_id) continue;
      const current = technicianStats.get(order.technician_id) ?? { total: 0, open: 0, inProgress: 0, done: 0, waitingParts: 0 };
      current.total += 1;
      if (order.status === "open") current.open += 1;
      if (order.status === "in_progress") current.inProgress += 1;
      if (order.status === "done") current.done += 1;
      if (order.status === "waiting_parts") current.waitingParts += 1;
      technicianStats.set(order.technician_id, current);
    }

    res.json({
      technicians: (data ?? []).map((technician) => ({
        ...technician,
        workload: technicianStats.get(technician.id) ?? { total: 0, open: 0, inProgress: 0, done: 0, waitingParts: 0 }
      }))
    });
  })
);

techniciansRouter.post(
  "/",
  requireAuth,
  requireActiveSubscription,
  requireFeature("orders"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const body = technicianSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("technicians")
      .insert({
        tenant_id: tenantId,
        full_name: body.fullName,
        phone: body.phone ?? null,
        email: body.email ?? null,
        active: body.active ?? true
      })
      .select("id, full_name, phone, email, active, created_at")
      .single();
    if (error) throw new AppError(error.message, 400, "technician_create_failed");
    res.status(201).json({ technician: data });
  })
);
