"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, Boxes, CreditCard, LayoutGrid, LineChart, Smartphone, Users, Wrench } from "lucide-react";

const featurePills = [
  "Formas de pago",
  "Productos",
  "Status",
  "Fechas de entrega",
  "Finanzas",
  "Categorías",
  "Contacto",
  "Gastos",
  "Órdenes",
  "Mensajería",
  "Estadísticas",
  "Existencias",
  "Garantías",
  "Alertas"
];

const plans = [
  {
    name: "Plan Esencial",
    price: "$300",
    description: "Base operativa para recepción, clientes y seguimiento de servicios.",
    accent: "bg-[#121826]",
    button: "Pruebalo gratis"
  },
  {
    name: "Plan Pro",
    price: "$450",
    description: "Para inventario, reportes y control más sólido de tu operación diaria.",
    accent: "bg-[#8256f3]",
    button: "Pruebalo gratis"
  },
  {
    name: "Plan Total",
    price: "$600",
    description: "Acceso completo para talleres que necesitan finanzas y control avanzado.",
    accent: "bg-[#f0a23a]",
    button: "Hablar con ventas"
  }
];

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ee] text-slate-700">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#121826] text-[#a78bfa] shadow-[0_8px_24px_rgba(15,23,42,.18)]">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="text-[14px] font-black tracking-[-0.03em] text-[#121826]">Fixi</div>
          </div>

          <nav className="hidden items-center gap-10 text-[15px] text-slate-500 md:flex">
            <a href="#inicio" className="transition hover:text-slate-800">Inicio</a>
            <a href="#caracteristicas" className="transition hover:text-slate-800">Características</a>
            <a href="#planes" className="transition hover:text-slate-800">Planes</a>
            <a href="#contacto" className="transition hover:text-slate-800">Contacto</a>
          </nav>

          <Link
            href="/login"
            className="rounded-full bg-[#121826] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(15,23,42,.18)] transition hover:bg-[#252f44]"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section id="inicio" className="mx-auto max-w-[1500px] px-4 py-10 md:px-8 md:py-12">
        <div className="rounded-[36px] border border-slate-200 bg-white px-5 py-10 shadow-[0_22px_55px_rgba(15,23,42,.08)] md:px-12 md:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_.92fr]">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex rounded-full border border-slate-200 bg-[#fbfbfc] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Software para talleres de reparación
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-700 md:text-6xl lg:text-7xl">
                Administra tu taller
                <span className="mx-2 inline-flex align-middle text-4xl md:text-6xl">🔧</span>
                <br />
                con una experiencia <span className="font-black text-[#121826]">clara y moderna</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium text-slate-400 md:text-xl">
                Recepción, inventario, clientes y finanzas en un sistema pensado para operación real, sin ruido visual ni pasos innecesarios.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-full bg-[#121826] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,.2)]"
                >
                  Pruebalo gratis
                </Link>
                <a
                  href="#planes"
                  className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700"
                >
                  Conoce más
                </a>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-[#fbfbfc] p-5 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
              <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Vista previa</p>
                    <p className="mt-1 text-lg font-semibold text-slate-700">Operación diaria</p>
                  </div>
                  <div className="rounded-full bg-[#efe7ff] px-4 py-2 text-xs font-semibold text-[#8256f3]">
                    15 días gratis
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "Recepción rápida",
                    "Órdenes en curso",
                    "Stock controlado",
                    "Clientes activos"
                  ].map((item, index) => (
                    <div key={item} className={`rounded-2xl p-4 text-sm font-medium ${index % 2 === 0 ? "bg-[#f7f3ff] text-slate-700" : "bg-[#fff6ee] text-slate-700"}`}>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">Panel</p>
                      <p className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-800">Todo el control</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#121826] text-white">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      "Órdenes",
                      "Inventario",
                      "Finanzas"
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-200 bg-[#fafafa] px-3 py-4 text-center text-xs font-semibold text-slate-500">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="planes" className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <article
                key={plan.name}
                className={`rounded-[28px] border p-6 text-left shadow-[0_14px_38px_rgba(15,23,42,.08)] ${
                  index === 1 ? "border-slate-900 bg-white" : "border-slate-200 bg-[#fbfbfc]"
                }`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${plan.accent} text-white`}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="mt-5 text-3xl font-black tracking-[-0.05em] text-slate-800">{plan.name}</div>
                <div className="mt-2 text-5xl font-black tracking-[-0.08em] text-slate-900">{plan.price}</div>
                <p className="mt-3 text-sm text-slate-500">{plan.description}</p>
                <Link
                  href="/login"
                  className={`mt-6 inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white ${plan.accent}`}
                >
                  {plan.button}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="caracteristicas" className="mx-auto max-w-[1500px] px-4 pb-8 md:px-8">
        <div className="grid gap-3">
          <div className="flex flex-wrap justify-center gap-4">
            {featurePills.slice(0, 7).map((pill, index) => (
              <span
                key={pill}
                className={`rounded-full px-8 py-2 text-sm font-medium shadow-sm ${
                  index === 2 || index === 3 || index === 6
                    ? "bg-gradient-to-r from-[#121826] to-[#8256f3] text-white"
                    : index === 4
                      ? "bg-[#f0ece5] text-slate-500"
                      : "bg-[#fde9e0] text-slate-400"
                }`}
              >
                {pill}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {featurePills.slice(7).map((pill, index) => (
              <span
                key={pill}
                className={`rounded-full px-8 py-2 text-sm font-medium shadow-sm ${
                  index === 1 || index === 5
                    ? "bg-gradient-to-r from-[#121826] to-[#8256f3] text-white"
                    : index === 2
                      ? "bg-[#f9edcf] text-slate-500"
                      : "bg-[#eee6ff] text-slate-400"
                }`}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 pb-20 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Caracteristicas</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-slate-700 md:text-5xl">
              Menos ruido visual, más control del taller.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-slate-400">
              Recepción, inventario, clientes, reportes y finanzas en una sola plataforma lista para producción.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { label: "Recepción", icon: Smartphone },
                { label: "Técnico", icon: Wrench },
                { label: "Clientes", icon: Users },
                { label: "Stock", icon: Boxes },
                { label: "Finanzas", icon: CreditCard },
                { label: "Reportes", icon: LineChart }
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-3xl border border-slate-200 bg-[#fbfbfc] p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ece3ff] text-[#8256f3]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-slate-700">{label}</div>
                  <div className="mt-1 text-sm text-slate-400">Módulo listo para operación real.</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[#fbfbfc] p-8 shadow-[0_18px_50px_rgba(15,23,42,.08)]">
            <div className="mx-auto max-w-sm rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,.06)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#121826] text-[#a78bfa] shadow-[0_12px_28px_rgba(15,23,42,.18)]">
                <BadgeCheck className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-slate-700">Todo listo para producción</h3>
              <p className="mt-3 text-slate-400">
                Acceso real, tenant real y flujo completo para taller de reparación.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#8256f3] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(130,86,243,.25)]"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-[1500px] px-4 pb-24 md:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Contacto</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-700">Fixi para tu taller</h2>
          <p className="mt-3 text-slate-400">Una landing más limpia, más clara y pensada para operación real.</p>
        </div>
      </section>
    </main>
  );
}
