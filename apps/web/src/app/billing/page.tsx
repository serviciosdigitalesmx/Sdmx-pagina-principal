"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/runtime.js";

const plans = [
  { name: "Starter", subtitle: "Prueba gratis", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC ?? "" },
  { name: "Pro", subtitle: "Operación intensa", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ?? "" },
  { name: "Scale", subtitle: "Plan enterprise", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_SCALE ?? "" }
];

export default function BillingPage() {
  const [billing, setBilling] = useState<{ subscription?: { status?: string; plan?: { name?: string; code?: string } }; storage?: { usedBytes?: number; limitBytes?: number | null; percentUsed?: number | null; warning?: boolean; blocked?: boolean } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch("/v1/billing/status")
      .then((data) => setBilling(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  async function checkout(priceId: string) {
    const payload = await apiFetch("/v1/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId })
    });
    window.location.href = payload.url;
  }

  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Planes de Pago</h1>
        <p className="muted">Prueba, activación y upgrade real.</p>
      </header>
      {billing?.storage ? (
        <section className="card stack section">
          <strong>Uso de almacenamiento</strong>
          <div className="muted">
            {formatBytes(billing.storage.usedBytes ?? 0)} / {billing.storage.limitBytes ? formatBytes(billing.storage.limitBytes) : "Ilimitado"}
          </div>
          <div className="progress-shell">
            <div
              className={`progress-bar ${billing.storage.blocked ? "danger" : billing.storage.warning ? "warning" : ""}`}
              style={{ width: `${billing.storage.percentUsed ?? 0}%` }}
            />
          </div>
          <div className="muted">
            {billing.storage.percentUsed ? `${billing.storage.percentUsed}% usado` : "Sin límite de cuota"}
          </div>
          {billing.storage.warning ? <div className="muted">Advertencia: te acercas al límite.</div> : null}
          {billing.storage.blocked ? <div className="muted">Bloqueo: cuota alcanzada.</div> : null}
        </section>
      ) : null}
      {error ? <p>{error}</p> : null}
      <div className="cards section">
        {plans.map((plan) => (
          <article key={plan.name} className="card stack">
            <strong>{plan.name}</strong>
            <p className="muted">{plan.subtitle}</p>
            <button type="button" onClick={() => checkout(plan.priceId)} disabled={!plan.priceId}>
              {plan.priceId ? "Continuar con pago" : "Configurar plan"}
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
