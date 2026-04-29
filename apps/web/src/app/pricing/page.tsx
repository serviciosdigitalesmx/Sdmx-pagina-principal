"use client";

import { createBrowserClient } from "@supabase/ssr";

const plans = [
  {
    name: "Starter",
    price: "$0",
    orders: "50 órdenes/mes",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "",
    cta: "Comenzar trial"
  },
  {
    name: "Pro",
    price: "$39",
    orders: "500 órdenes/mes",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "",
    cta: "Activar Pro"
  },
  {
    name: "Scale",
    price: "Custom",
    orders: "Límites a medida",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE ?? "",
    cta: "Hablar ventas"
  }
];

async function handleCheckout(priceId: string) {
  if (!priceId) {
    throw new Error("Missing Stripe price id");
  }
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("No session");
  const res = await fetch(`${apiBaseUrl}/v1/billing/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ priceId })
  });
  if (!res.ok) throw new Error("Checkout failed");
  const payload = await res.json();

  window.location.href = payload.url;
}

export default function PricingPage() {
  return (
    <main className="shell">
      <h1>Pricing</h1>
      <div className="cards">
        {plans.map((plan) => (
          <article key={plan.name} className="card">
            <h2>{plan.name}</h2>
            <strong>{plan.price}</strong>
            <p>{plan.orders}</p>
            <button type="button" onClick={() => handleCheckout(plan.priceId)}>{plan.cta}</button>
          </article>
        ))}
      </div>
    </main>
  );
}
