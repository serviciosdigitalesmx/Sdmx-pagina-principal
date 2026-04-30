import Stripe from "stripe";
import { env } from "./env.js";

let stripeInstance: Stripe | null = null;

export function getStripeClient() {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia"
    });
  }
  return stripeInstance;
}

export function requireStripeClient() {
  const client = getStripeClient();
  if (!client) {
    throw new Error("STRIPE_SECRET_KEY is required for billing routes");
  }
  return client;
}
