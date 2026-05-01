"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Boxes, CreditCard, LayoutGrid, LineChart, Smartphone, Users, Wrench } from "lucide-react";

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

const tabs = ["Órdenes", "Inventario", "Reportes", "Clientes"];

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[#f4f5f7] text-slate-700">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8256f3] text-white shadow-[0_8px_24px_rgba(130,86,243,.28)]">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[14px] font-black tracking-[-0.03em] text-[#8256f3]">Fixi</div>
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-[15px] text-slate-500 md:flex">
            <a href="#inicio" className="transition hover:text-slate-800">Inicio</a>
            <a href="#caracteristicas" className="transition hover:text-slate-800">Características</a>
            <a href="#planes" className="transition hover:text-slate-800">Planes</a>
            <a href="#contacto" className="transition hover:text-slate-800">Contacto</a>
          </nav>

          <Link
            href="/login"
            className="rounded-lg bg-[#8256f3] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(130,86,243,.25)] transition hover:bg-[#7446ea]"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section id="inicio" className="mx-auto max-w-[1500px] px-4 py-10 md:px-8 md:py-12">
        <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-10 shadow-[0_20px_50px_rgba(15,23,42,.08)] md:px-10 md:py-14">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-10 flex flex-wrap justify-center gap-3">
              {tabs.map((tab, index) => (
                <span
                  key={tab}
                  className={`rounded-[14px] px-9 py-3 text-sm font-semibold shadow-sm ${
                    index === 0
                      ? "border-2 border-slate-900 bg-white text-slate-900"
                      : "border border-slate-200 bg-[#fbfbfc] text-slate-500"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>

            <div className="mx-auto max-w-5xl">
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-700 md:text-6xl lg:text-7xl">
                Te presentamos el mejor software
                <span className="mx-3 inline-flex align-middle text-4xl md:text-6xl">🛠️</span>
                <br />
                para administrar tu <span className="font-black text-slate-900">taller de reparación</span>
              </h1>
              <p className="mt-6 text-lg font-medium text-slate-400 md:text-xl">
                Toma el control de tu negocio con una sola aplicación.
              </p>
            </div>

            <div className="mt-10 flex justify-center">
              <div className="inline-flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,.08)]">
                <button className="rounded-xl bg-[#8256f3] px-8 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(130,86,243,.24)]">
                  Pruebalo gratis
                </button>
                <button className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-semibold text-slate-700">
                  Conoce mas
                </button>
              </div>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-400">
              Inicia tu prueba gratuita de 15 dias. Sin necesidad de ingresar tu tarjeta de credito.
            </p>
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
                    ? "bg-gradient-to-r from-[#8f5be7] to-[#f0a23a] text-white"
                    : index === 4
                      ? "bg-[#efe3ff] text-slate-500"
                      : "bg-[#f7dede] text-slate-400"
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
                    ? "bg-gradient-to-r from-[#8f5be7] to-[#f0a23a] text-white"
                    : index === 2
                      ? "bg-[#fbefcf] text-slate-500"
                      : "bg-[#e9ddff] text-slate-400"
                }`}
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-white px-6 py-10 shadow-[0_18px_50px_rgba(15,23,42,.1)] md:px-10 md:py-12">
          <div className="mx-auto flex max-w-4xl justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-[#8256f3] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(130,86,243,.25)]"
            >
              Pruebalo gratis
            </Link>
            <Link
              href="/billing"
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
            >
              Conoce mas
            </Link>
          </div>

          <p className="mt-8 text-center text-sm font-medium text-slate-400">
            Inicia tu prueba gratuita de 15 dias. Sin necesidad de ingresar tu tarjeta de credito.
          </p>

          <div className="pointer-events-none absolute inset-x-0 bottom-[-2.2rem] text-center text-[clamp(3rem,12vw,10rem)] font-black tracking-[-0.08em] text-slate-100">
            TODO EL CONTROL
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-[1500px] px-4 pb-20 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8256f3]">Caracteristicas</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-slate-700 md:text-5xl">
              Toma el control de tu negocio con una sola aplicacion.
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#8256f3] text-white shadow-[0_12px_28px_rgba(130,86,243,.25)]">
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
          <p className="mt-3 text-slate-400">Una landing más limpia, más clara y más parecida al diseño que compartiste.</p>
        </div>
      </section>
    </main>
  );
}
