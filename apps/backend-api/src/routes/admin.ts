import { Router } from "express";
import { asyncHandler, AppError } from "../core/http.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { requireActiveSubscription } from "../middleware/subscription.js";
import { requireFeature } from "../middleware/plan.js";

export const adminRouter = Router();

adminRouter.get(
  "/audit-events",
  requireAuth,
  requireActiveSubscription,
  requireFeature("reports"),
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const limit = Math.min(Number(req.query.limit ?? 50) || 50, 100);

    const { data, error } = await supabaseAdmin
      .from("audit_events")
      .select("id, action, resource_type, resource_id, metadata, actor_user_id, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new AppError(error.message, 400, "audit_event_list_failed");
    res.json({ events: data ?? [] });
  })
);
