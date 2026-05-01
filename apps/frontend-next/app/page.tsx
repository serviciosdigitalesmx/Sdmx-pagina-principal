"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Boxes, CreditCard, LayoutGrid, LineChart, Smartphone, Users, Wrench } from "lucide-react";

const features = [
  "Recepción profesional y panel técnico",
  "Portal del cliente por falla automática",
  "Control de refacciones, stock y compras",
  "Finanzas completas con Mercado Pago",
  "Sistema de referidos para todos los planes"
];

const plans = [
  {
    name: "Plan Esencial",
    price: "$350",
    tag: "Inicio",
    blurb: "Para orden, agenda y control de servicios.",
    cta: "Comenzar ahora"
  },
  {
    name: "Plan Pro",
    price: "$549",
    tag: "Recomendado",
    blurb: "Operación completa para talleres en crecimiento.",
    cta: "Lo quiero ya"
  },
  {
    name: "Plan Business",
    price: "$850",
    tag: "Escala",
    blurb: "Multi-sucursal, finanzas y control avanzado.",
    cta: "Hablar con ventas"
  }
];

const stats = [
  { label: "Estados en México", value: "+32" },
  { label: "Órdenes creadas", value: "+150,000" }
];

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[#071225] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071225]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <LayoutGrid className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-black tracking-[0.2em] text-blue-400">FIXI</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">SaaS para talleres</div>
            </div>
          </div>

          <nav className="hidden gap-6 text-sm font-semibold text-slate-300 md:flex">
            <a href="#caracteristicas" className="hover:text-white">Características</a>
            <a href="#planes" className="hover:text-white">Planes</a>
            <a href="#impacto" className="hover:text-white">Impacto</a>
            <a href="#testimonios" className="hover:text-white">Testimonios</a>
          </nav>

          <Link href="/login" className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-500/25">
            Entrar
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.24),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(255,106,42,.15),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl gap-14 px-4 py-20 md:px-8 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
              Sistema de gestión para talleres modernos
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.92] md:text-7xl">
              Convierte tu taller en una
              <span className="mt-3 block text-orange-400">operación profesional</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Recepción, seguimiento técnico, clientes, inventario y finanzas en una sola plataforma.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/billing" className="rounded-full bg-blue-500 px-6 py-3 font-black text-white shadow-lg shadow-blue-500/25">
                Ver planes
              </Link>
              <Link href="/login" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-black text-white">
                Acceder al panel
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              {["WhatsApp", "Google", "TikTok", "Facebook", "Web", "CRM", "Stock", "SPEI"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,.35)]">
              <div className="rounded-[1.5rem] bg-[#101a36] p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                      <div className="text-4xl font-black text-blue-400">{stat.value}</div>
                      <div className="mt-2 text-xs font-black uppercase tracking-[0.3em] text-slate-400">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black text-white">Operación completa para talleres modernos</div>
                      <div className="text-xs text-slate-400">Recepción, inventario, clientes y finanzas</div>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    {["Recepción", "Inventario", "Finanzas"].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-[#071225] px-3 py-4 text-xs font-black uppercase tracking-[0.22em] text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-blue-400">Características</p>
            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Te presentamos nuestras <span className="text-blue-400">características</span>
            </h2>
            <p className="mt-4 max-w-xl text-slate-300">
              Toma el control de tu negocio con una sola aplicación. Visualiza órdenes, clientes, servicios y pagos en un mismo flujo.
            </p>

            <div className="mt-8 space-y-4">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-slate-200">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                    <BadgeCheck className="h-4 w-4" />
                  </span>
                  <span className="font-semibold">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Recepción", icon: Smartphone },
                { label: "Técnico", icon: Wrench },
                { label: "Clientes", icon: Users },
                { label: "Stock", icon: Boxes },
                { label: "Finanzas", icon: CreditCard },
                { label: "Reportes", icon: LineChart }
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-black">{label}</div>
                  <div className="mt-1 text-sm text-slate-400">Módulo listo para operación real.</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-orange-400">Planes de pago</p>
          <h2 className="mt-4 text-4xl font-black md:text-5xl">Elige el nivel de control que necesita tu taller</h2>
          <p className="mt-3 text-slate-300">Tres planes claros, pensados para subir de nivel sin cambiar de sistema.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border p-6 shadow-[0_20px_70px_rgba(0,0,0,.25)] ${
                index === 1
                  ? "border-orange-400/60 bg-[#101a36] ring-1 ring-orange-400/30"
                  : "border-white/10 bg-[#0d1630]/90"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase">{plan.name}</h3>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${index === 1 ? "bg-orange-400/15 text-orange-300" : "bg-blue-500/15 text-blue-300"}`}>
                  {plan.tag}
                </span>
              </div>
              <div className="mt-6 text-6xl font-black leading-none">{plan.price}</div>
              <div className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">MXN / mes</div>
              <p className="mt-4 text-slate-300">{plan.blurb}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {["Flujo operativo completo", "Soporte para tu equipo", "Actualizaciones constantes"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-blue-400">•</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/billing"
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 font-black ${
                  index === 1 ? "bg-white text-[#071225]" : "bg-blue-500 text-white"
                }`}
              >
                {plan.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="impacto" className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-8 lg:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Impacto</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-5xl font-black text-white">100%</div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Operación visible</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-5xl font-black text-white">24/7</div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Seguimiento</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-5xl font-black text-white">380°</div>
                <div className="mt-2 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Control total</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#0d1630]/90 p-8">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Acción</p>
            <h3 className="mt-4 text-3xl font-black">Entra al panel y arranca hoy</h3>
            <p className="mt-3 text-slate-300">El SaaS ya está listo para que conectes recepción, técnico y finanzas.</p>
            <Link href="/billing" className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-blue-500 px-5 py-3 font-black text-white">
              Ver planes
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
