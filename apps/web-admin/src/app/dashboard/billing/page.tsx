"use client";

import { BillingExpiredScreen } from "@/components/billing/billing-expired-screen";

const PLANS = [
  { name: "Básico", price: "$300 MXN/mes", description: "Para talleres que comienzan a operar y necesitan control esencial." },
  { name: "Pro", price: "$450 MXN/mes", description: "Para operación diaria con módulos ampliados y mayor capacidad." },
  { name: "Avanzado", price: "$600 MXN/mes", description: "Para equipos con más volumen, sucursales y control integral." },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <BillingExpiredScreen />
      <section className="mx-auto -mt-4 w-full max-w-6xl px-4 pb-10">
        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <article key={plan.name} className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="text-xs uppercase tracking-[0.32em] text-sky-300/80">{plan.name}</p>
              <h2 className="mt-3 text-3xl font-semibold">{plan.price}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{plan.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

