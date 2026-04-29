import { Router, raw } from "express";
import Stripe from "stripe";
import { asyncHandler, AppError } from "../core/http.js";
import { logAuditEvent } from "../core/audit.js";
import { stripe } from "../core/stripe.js";
import { supabaseAdmin } from "../core/supabase.js";

export const webhooksRouter = Router();

webhooksRouter.post(
  "/stripe",
  raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new AppError("Missing STRIPE_WEBHOOK_SECRET", 500, "webhook_secret_missing");

    const signature = req.header("stripe-signature");
    if (!signature) throw new AppError("Missing stripe signature", 400, "invalid_webhook");

    const event = stripe.webhooks.constructEvent(req.body, signature, secret);

    const { data: processed } = await supabaseAdmin
      .from("webhook_events")
      .select("id")
      .eq("id", event.id)
      .maybeSingle();

    if (processed) {
      res.json({ received: true });
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const tenantId = session.metadata?.tenant_id;
      const priceId = session.metadata?.price_id ?? null;
      if (!tenantId) throw new AppError("Missing tenant metadata", 400, "invalid_webhook");

      const { data: plan } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("stripe_price_id", priceId)
        .maybeSingle();

      if (!plan) throw new AppError("Plan not found for stripe price", 400, "plan_not_found");

      const { error } = await supabaseAdmin.from("subscriptions").upsert(
        {
          tenant_id: tenantId,
          plan_id: plan.id,
          status: "active",
          provider: "stripe",
          provider_subscription_id: typeof session.subscription === "string" ? session.subscription : null
        },
        { onConflict: "tenant_id" }
      );

      if (error) throw new AppError(error.message, 500, "subscription_upsert_failed");

      void logAuditEvent({
        tenantId,
        action: "checkout_completed",
        resourceType: "subscription",
        resourceId: tenantId,
        metadata: { plan_id: plan.id, provider_subscription_id: typeof session.subscription === "string" ? session.subscription : null }
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: localSubscription } = await supabaseAdmin
        .from("subscriptions")
        .select("tenant_id")
        .eq("provider_subscription_id", subscription.id)
        .maybeSingle();
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: "canceled" })
        .eq("provider_subscription_id", subscription.id);

      if (error) throw new AppError(error.message, 500, "subscription_update_failed");

      if (localSubscription?.tenant_id) {
        void logAuditEvent({
          tenantId: localSubscription.tenant_id,
          action: "subscription_canceled",
          resourceType: "subscription",
          resourceId: subscription.id,
          metadata: { provider: "stripe" }
        });
      }
    }

    const { error: eventInsertError } = await supabaseAdmin.from("webhook_events").insert({ id: event.id });
    if (eventInsertError) throw new AppError(eventInsertError.message, 500, "webhook_event_record_failed");

    res.json({ received: true });
  })
);
