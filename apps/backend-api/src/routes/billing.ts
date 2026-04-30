import { Router } from "express";
import { z } from "zod";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { logger } from "../core/logger.js";
import { getStripeClient, requireStripeClient } from "../core/stripe.js";
import { supabaseAdmin } from "../core/supabase.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveTenant } from "../middleware/tenant.js";
import { getBillingStorageSummary } from "../core/storage-quota.js";

const checkoutSchema = z.object({
  priceId: z.string().min(1)
});

export const billingRouter = Router();

function ensureBillingReady() {
  if (!getStripeClient()) {
    throw new AppError("Billing provider not configured", 503, "billing_provider_unavailable");
  }
}

billingRouter.get(
  "/status",
  requireAuth,
  resolveTenant,
  asyncHandler(async (req, res) => {
    const tenantId = req.context!.tenantId;
    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("status, provider, provider_subscription_id, current_period_end, plan:plans(id, code, name, limits, max_orders, price_mxn)")
      .eq("tenant_id", tenantId)
      .in("status", ["trialing", "active", "past_due", "canceled"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new AppError(error.message, 400, "billing_status_failed");

    const storage = await getBillingStorageSummary(tenantId);
    res.json({ subscription, storage });
  })
);

billingRouter.post(
  "/checkout",
  requireAuth,
  resolveTenant,
  asyncHandler(async (req, res) => {
    ensureBillingReady();
    const stripe = requireStripeClient();
    const { priceId } = checkoutSchema.parse(req.body);
    const tenantId = req.context!.tenantId;

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id, name")
      .eq("id", tenantId)
      .single();

    if (tenantError) throw new AppError(tenantError.message, 400, "tenant_lookup_failed");

    const successUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`
      : "http://localhost:3000/dashboard?billing=success";
    const cancelUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/pricing?billing=cancelled`
      : "http://localhost:3000/pricing?billing=cancelled";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenant_id: tenant.id, tenant_name: tenant.name, price_id: priceId }
    });

    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "checkout_created",
      resourceType: "billing_session",
      resourceId: session.id,
      metadata: { priceId, tenant_name: tenant.name }
    });

    res.json({ url: session.url });
  })
);

billingRouter.post(
  "/reconcile",
  requireAuth,
  resolveTenant,
  asyncHandler(async (req, res) => {
    ensureBillingReady();
    const stripe = requireStripeClient();
    const tenantId = req.context!.tenantId;

    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (error) throw new AppError(error.message, 500, "subscription_lookup_failed");
    if (!subscription?.provider_subscription_id) {
      res.json({ reconciled: false, reason: "no_provider_subscription_id" });
      return;
    }

    const remote = await stripe.subscriptions.retrieve(subscription.provider_subscription_id);

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: remote.status === "past_due" ? "past_due" : remote.status === "active" ? "active" : "trialing",
        current_period_end: new Date(remote.current_period_end * 1000).toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) throw new AppError(updateError.message, 500, "reconcile_failed");

    logger.info({ event: "billing.reconcile", tenant_id: tenantId, provider_subscription_id: subscription.provider_subscription_id });
    void logAuditEvent({
      tenantId,
      actorUserId: req.context?.userId ?? null,
      action: "reconcile",
      resourceType: "subscription",
      resourceId: subscription.provider_subscription_id,
      metadata: { status: remote.status, current_period_end: remote.current_period_end }
    });
    res.json({ reconciled: true });
  })
);
