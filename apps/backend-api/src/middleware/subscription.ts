import type { NextFunction, Request, Response } from "express";
import { AppError } from "../core/http.js";
import { supabaseAdmin } from "../core/supabase.js";

type SubscriptionRow = {
  status: string;
  plan_id: string;
  plans?: { code: string; limits: Record<string, boolean | number> } | null;
};

export async function requireActiveSubscription(req: Request, _res: Response, next: NextFunction) {
  const tenantId = req.context?.tenantId;
  if (!tenantId) {
    return next(new AppError("Tenant context missing", 401, "unauthorized"));
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status, plan_id, plans(code, limits)")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return next(new AppError(error.message, 500, "subscription_lookup_failed"));
  if (!data) {
    return next(new AppError("Subscription inactive", 402, "subscription_required"));
  }

  if (data.status === "past_due") {
    return next(new AppError("Payment required", 402, "payment_required"));
  }

  if (!["active", "trialing"].includes(data.status)) {
    return next(new AppError("Subscription inactive", 402, "subscription_required"));
  }

  const subscriptionData = data as unknown as SubscriptionRow;
  req.context = {
    userId: req.context!.userId,
    tenantId,
    subscription: subscriptionData.plans
      ? {
          status: subscriptionData.status,
          plan_id: subscriptionData.plan_id,
          plans: subscriptionData.plans
        }
      : {
          status: subscriptionData.status,
          plan_id: subscriptionData.plan_id
        }
  };
  next();
}
