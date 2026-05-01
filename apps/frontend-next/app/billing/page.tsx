"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, CreditCard, Sparkles } from "lucide-react";
import { SaasShell } from "@/components/ui/SaasShell";
import { apiClient } from "@/lib/apiClient";

type PlanCode = "basic" | "pro" | "enterprise";

const plans: Array<{ code: PlanCode; name: string; price: string; description: string; tag: string; feature: string[] }> = [
  {
    code: "basic",
    name: "Plan Essential",
    price: "$350",
    description: "Ideal para control de servicios y agenda. Incluye 15 días de prueba gratuita con todo activo.",
    tag: "Inicio",
    feature: ["Recepción simple", "Clientes básicos", "Control de órdenes"]
  },
  {
    code: "pro",
    name: "Plan Pro",
    price: "$549",
    description: "Para el taller que ya vende, repara y reporta. Incluye 15 días de prueba gratuita con todo activo.",
    tag: "Recomendado",
    feature: ["Recepción + técnico", "Inventario", "Reportes"]
  },
  {
    code: "enterprise",
    name: "Plan Business",
    price: "$850",
    description: "Multi-sucursal y operación a escala. Incluye 15 días de prueba gratuita con todo activo.",
    tag: "Escala",
    feature: ["Multi-sucursal", "Finanzas completas", "Control avanzado"]
  }
];

export default function BillingPage() {
  const router = useRouter();
  const skipBilling = process.env.NEXT_PUBLIC_E2E_BILLING_BYPASS === "1";

  async function checkout(plan: PlanCode) {
    if (skipBilling) {
      router.push("/hub");
      return;
    }

    const res = await apiClient.post<{ initPoint: string }>("/api/billing/checkout", { plan });
    if (!res.success || !res.data?.initPoint) {
      throw new Error(res.error?.message || "No se pudo crear checkout");
    }
    window.location.href = res.data.initPoint;
  }

  return (
    <SaasShell title="Planes de Pago" subtitle="Elige el nivel de control que necesita tu taller.">
      <section className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-400">Planes de Pago</p>
            <h2 className="mt-4 text-4xl font-black md:text-5xl">Elige el plan que mejor encaje con tu operación</h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              Todos los planes arrancan con 15 días de prueba gratuita y acceso completo. Después eliges el plan que se mantiene activo.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-black text-white">
              <Sparkles className="h-4 w-4 text-blue-400" />
              Sistema listo para producción
            </div>
            <p className="mt-1 text-xs">Sin mocks, con backend real y tenant multi-empresa.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        {plans.map((plan, index) => (
          <article
            key={plan.code}
            className={`rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(0,0,0,.28)] ${
              index === 1 ? "border-orange-400/60 bg-[#101a36] ring-1 ring-orange-400/25" : "border-white/10 bg-[#0d1630]/90"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tight text-white">{plan.name}</h3>
              <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${index === 1 ? "bg-orange-400/15 text-orange-300" : "bg-blue-500/15 text-blue-300"}`}>
                {plan.tag}
              </span>
            </div>

            <div className="mt-6 flex items-end gap-2">
              <div className="text-6xl font-black leading-none text-white">{plan.price}</div>
              <div className="pb-1 text-xs font-black uppercase tracking-[0.3em] text-slate-400">MXN / mes</div>
            </div>

            <p className="mt-4 text-slate-300">{plan.description}</p>

            <div className="mt-6 space-y-3">
              {plan.feature.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-200">
                  <BadgeCheck className="h-4 w-4 text-blue-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => checkout(plan.code)}
              className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black ${
                index === 1 ? "bg-white text-[#071225]" : "bg-blue-500 text-white"
              }`}
            >
              {skipBilling ? "Ir al dashboard" : "Pagar y activar"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-6 md:p-8">
          <h3 className="text-2xl font-black text-white">Qué incluye cada plan</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {["Recepción", "Clientes", "Taller", "Inventario", "Finanzas", "Reportes"].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">{item}</div>
                <div className="mt-2 text-white">Módulo activo en el flujo SaaS.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-6 md:p-8">
          <h3 className="text-2xl font-black text-white">Antes de pagar</h3>
          <p className="mt-3 text-slate-300">
            Si estás probando el flujo localmente, puedes volver al panel. En producción, este botón dirige al checkout real.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/hub" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 font-black text-[#071225]">
              Ir al hub
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 font-black text-white">
              Ver sesión
            </Link>
          </div>
          <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm text-blue-100">
            <CreditCard className="mb-2 h-5 w-5 text-blue-400" />
            El checkout real sigue disponible cuando `NEXT_PUBLIC_E2E_BILLING_BYPASS` está apagado.
          </div>
        </div>
      </section>
    </SaasShell>
  );
}
