"use client";

import { useEffect, useState } from "react";
import { SaasShell } from "@/components/ui/SaasShell";
import { apiClient } from "@/lib/apiClient";
import { Activity, ClipboardList, CreditCard, Users } from "lucide-react";

interface DashboardSummary {
  openOrders: number;
  inProgressOrders: number;
  readyOrders: number;
  totalCustomers: number;
  totalSalesMxn: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    apiClient
      .get<DashboardSummary>("/api/dashboard/summary")
      .then((res) => {
        if (!mounted) return;
        if (res.success) setSummary(res.data || null);
        else setError(res.error?.message || "No se pudo cargar dashboard");
      })
      .catch((err) => {
        if (mounted) setError(err.message || "No se pudo cargar dashboard");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cards = [
    { 
      label: "Órdenes Abiertas", 
      value: summary ? String(summary.openOrders) : "—", 
      icon: ClipboardList, 
      badge: "Recibidas",
      color: "srf-badge-blue"
    },
    { 
      label: "En Diagnóstico", 
      value: summary ? String(summary.inProgressOrders) : "—", 
      icon: Activity, 
      badge: "Taller",
      color: "srf-badge-orange"
    },
    { 
      label: "Listas p/ Entrega", 
      value: summary ? String(summary.readyOrders) : "—", 
      icon: ClipboardList, 
      badge: "Finalizado",
      color: "srf-badge-green"
    },
    { 
      label: "Total Clientes", 
      value: summary ? String(summary.totalCustomers) : "—", 
      icon: Users, 
      badge: "CRM",
      color: "srf-badge-blue"
    }
  ];

  return (
    <SaasShell title="Dashboard" subtitle="Visión general de la operación en tiempo real.">
      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 font-bold flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="srf-kpi p-8 group hover:border-[#1F7EDC]/50 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="h-14 w-14 rounded-2xl bg-[#1F7EDC]/10 border border-[#1F7EDC]/20 flex items-center justify-center text-[#2FA4FF] group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`${card.color} px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border`}>
                  {card.badge}
                </span>
              </div>
              <div className="mt-8 text-slate-500 text-[10px] uppercase tracking-[0.25em] font-black">{card.label}</div>
              <div className="mt-2 text-5xl font-black text-white tracking-tighter">{card.value}</div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 srf-card p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-black text-white">Estado del SaaS</h2>
              <p className="text-slate-400 text-sm mt-1">Backend, tenant y API centralizada.</p>
            </div>
            <span className="srf-badge-green px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Online</span>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {["Frontend Next", "Backend Render", "Supabase RLS"].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-950/40 border border-white/10 p-4">
                <div className="text-white font-bold">{item}</div>
                <div className="text-slate-500 text-xs mt-1">Conectado al flujo SaaS.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="srf-card p-6">
          <h2 className="text-xl font-black text-white">Siguiente acción</h2>
          <p className="text-slate-400 text-sm mt-2">
            Activa billing, valida suscripción y migra módulos legacy al diseño nuevo.
          </p>
          <a href="/billing" className="mt-6 inline-flex w-full justify-center srf-btn-primary py-3">
            Ver paquetes
          </a>
        </div>
      </section>
    </SaasShell>
  );
}
