"use client";

import { useState } from "react";
import { SaasShell } from "@/components/ui/SaasShell";
import { apiClient } from "@/lib/apiClient";

type PlanCode = "basic" | "pro" | "enterprise";

const plans: Array<{ code: PlanCode; name: string; price: string; description: string; tag: string }> = [
  { code: "basic", name: "Básico", price: "$300 MXN/mes", description: "Para taller pequeño que necesita orden y seguimiento.", tag: "Inicio" },
  { code: "pro", name: "Pro", price: "$450 MXN/mes", description: "Operación completa: recepción, técnico, stock y reportes.", tag: "Recomendado" },
  { code: "enterprise", name: "Enterprise", price: "$600 MXN/mes", description: "Multi-sucursal, administración y control avanzado.", tag: "Escala" }
];

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [error, setError] = useState("");

  async function checkout(plan: PlanCode) {
    setLoadingPlan(plan);
    setError("");

    try {
      const res = await apiClient.post<{ initPoint: string }>("/api/billing/checkout", { plan });

      if (!res.success || !res.data?.initPoint) {
        throw new Error(res.error?.message || "No se pudo crear checkout");
      }

      window.location.href = res.data.initPoint;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creando checkout");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <SaasShell title="Planes y Billing" subtitle="Activa el tenant del taller con una suscripción mensual.">
      {error && <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 font-bold">{error}</div>}

      <section className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <article
            key={plan.code}
            className={`srf-card p-7 ${plan.code === "pro" ? "border-[#FF6A2A]/60 shadow-[0_0_35px_rgba(255,106,42,.12)]" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white">{plan.name}</h2>
              <span className={`${plan.code === "pro" ? "srf-badge-orange" : "srf-badge-blue"} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                {plan.tag}
              </span>
            </div>

            <p className="text-4xl font-black mt-6 text-white">{plan.price}</p>
            <p className="text-slate-400 mt-4 text-sm min-h-12">{plan.description}</p>

            <button
              onClick={() => checkout(plan.code)}
              disabled={loadingPlan !== null}
              className="mt-8 w-full srf-btn-primary py-4 disabled:opacity-50"
            >
              {loadingPlan === plan.code ? "Creando checkout..." : "Pagar y activar"}
            </button>
          </article>
        ))}
      </section>
    </SaasShell>
  );
}
