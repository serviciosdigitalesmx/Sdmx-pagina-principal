"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAuthToken } from "@/lib/auth-storage";
import { HeroButton, ShellBadge, StatCard, srFixTheme } from "@/components/srfix-theme";
import { getPublicApiPath } from "@/lib/public-api";

type BillingPlanCode = "basic" | "pro" | "enterprise";

const plans: Array<{
  code: BillingPlanCode;
  name: string;
  price: string;
  description: string;
  features: string[];
}> = [
  {
    code: "basic",
    name: "Plan Essential",
    price: "$300",
    description: "Para talleres que necesitan control de recepción y seguimiento.",
    features: ["Recepción", "Portal del cliente", "Base operativa"],
  },
  {
    code: "pro",
    name: "Plan Pro",
    price: "$450",
    description: "Para talleres con inventario, compras y reportes activos.",
    features: ["Inventario", "Compras", "Reportes"],
  },
  {
    code: "enterprise",
    name: "Plan Business",
    price: "$600",
    description: "Para operación multi-sucursal con finanzas y permisos avanzados.",
    features: ["Finanzas", "Seguridad", "Multi-sucursal"],
  },
];

export default function BillingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<BillingPlanCode | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(readAuthToken());
  }, []);

  const checkout = async (plan: BillingPlanCode) => {
    setError(null);
    setLoadingPlan(plan);

    try {
      if (!token) {
        throw new Error("Necesitas iniciar sesión antes de activar un plan.");
      }

      const response = await fetch(getPublicApiPath("/api/billing/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; initPoint?: string } | null;

      if (!response.ok || !payload?.initPoint) {
        throw new Error(payload?.error ?? "No se pudo crear el checkout");
      }

      window.location.assign(payload.initPoint);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Error inesperado");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 text-zinc-100" style={{ background: srFixTheme.background }}>
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-stone-700/70 bg-white/4 p-8 shadow-[0_16px_60px_rgba(0,0,0,0.24)]">
          <ShellBadge>Planes de pago</ShellBadge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-stone-50 sm:text-5xl">Activa el plan correcto para tu taller</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            El checkout conecta al API real, crea la preferencia de Mercado Pago y deja el tenant listo para que el webhook confirme el cobro.
          </p>
          {!token ? (
            <p className="mt-4 rounded-2xl border border-amber-700/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              No encontramos una sesión guardada. Entra primero y vuelve a esta pantalla para activar un plan.
            </p>
          ) : null}
          {error ? <p className="mt-4 rounded-2xl border border-rose-900/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard value="MP" label="checkout real" />
          <StatCard value="RLS" label="tenant aislado" />
          <StatCard value="30d" label="periodo activo por pago" />
        </div>

        <section className="grid gap-6 xl:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.code}
              className={`rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(0,0,0,.28)] ${
                index === 1 ? "border-orange-400/60 bg-[#101a36] ring-1 ring-orange-400/25" : "border-white/10 bg-[#0d1630]/90"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-orange-400">Plan</p>
                  <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">{plan.name}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${index === 1 ? "bg-orange-400/15 text-orange-300" : "bg-blue-500/15 text-blue-300"}`}>
                  {plan.price}
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">{plan.description}</p>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {feature}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void checkout(plan.code)}
                disabled={loadingPlan !== null}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  index === 1 ? "bg-white text-[#071225]" : "bg-blue-500 text-white"
                }`}
              >
                {loadingPlan === plan.code ? "Creando checkout..." : "Pagar y activar"}
              </button>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-6 md:p-8">
            <h3 className="text-2xl font-black text-white">Qué pasa después del pago</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Checkout", "Se crea la preferencia real con Mercado Pago."],
                ["Webhook", "Se confirma el cobro y se actualiza el tenant."],
                ["Estado", "El plan cambia en Supabase y el panel se habilita."],
                ["Auditoría", "Se registra el evento en el log operativo."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{title}</div>
                  <div className="mt-2 text-white">{copy}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-6 md:p-8">
            <h3 className="text-2xl font-black text-white">Navegación</h3>
            <p className="mt-3 text-slate-300">
              Si todavía no estás listo para pagar, puedes volver al panel o revisar tu sesión actual antes de activar el plan.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <HeroButton href="/hub">Volver al hub</HeroButton>
              <HeroButton href="/login" secondary>
                Ver sesión
              </HeroButton>
              <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-black text-white">
                Inicio
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
