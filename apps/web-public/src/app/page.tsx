import Link from "next/link";
import { requireEnv } from "@white-label/config";
import { PublicPortalLookup } from "@/components/public-portal-lookup";

const productName = requireEnv("NEXT_PUBLIC_SAAS_BRAND_NAME");
const brandShort = requireEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT");
const hubName = requireEnv("NEXT_PUBLIC_HUB_NAME");
const adminUrl = requireEnv("NEXT_PUBLIC_WEB_ADMIN_URL");
const publicUrl = requireEnv("NEXT_PUBLIC_WEB_PUBLIC_URL");
const trialDays = requireEnv("NEXT_PUBLIC_SAAS_TRIAL_DAYS");
const contactEmail = requireEnv("NEXT_PUBLIC_SAAS_CONTACT_EMAIL");
const contactPhone = requireEnv("NEXT_PUBLIC_SAAS_CONTACT_PHONE");

const featureCards = [
  {
    title: "Órdenes",
    description: "Crea, asigna y da seguimiento a cada reparación con el flujo del taller.",
    icon: "⌁",
  },
  {
    title: "Clientes",
    description: "Historial completo para atender cada equipo sin perder contexto.",
    icon: "◌",
  },
  {
    title: "Inventario",
    description: "Control de refacciones, accesorios y consumibles en tiempo real.",
    icon: "▣",
  },
  {
    title: "Evidencias",
    description: "Fotos y documentos por cada etapa del servicio.",
    icon: "◈",
  },
  {
    title: "WhatsApp",
    description: "Notificaciones y enlaces directos al portal del cliente.",
    icon: "✆",
  },
  {
    title: "Cobros y pagos",
    description: "Seguimiento de ingresos, comprobantes y estados de pago.",
    icon: "$",
  },
];

const pricingPlans = [
  {
    name: "Básico",
    price: "$300",
    period: "MXN / mes",
    description: "Para talleres que quieren arrancar con recepción, portal y seguimiento.",
    features: ["Órdenes ilimitadas", "Portal del cliente", "WhatsApp integrado"],
    featured: false,
  },
  {
    name: "Profesional",
    price: "$450",
    period: "MXN / mes",
    description: "Para quienes necesitan inventario, cotizaciones y procesos más completos.",
    features: ["Inventario avanzado", "Cotizaciones", "Reportes operativos"],
    featured: true,
  },
  {
    name: "Negocio",
    price: "$600",
    period: "MXN / mes",
    description: "Para operación multi-sucursal con control y permisos ampliados.",
    features: ["Multi-sucursal", "Permisos", "Respaldos y seguridad"],
    featured: false,
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-400/90">{children}</p>
  );
}

function CTA({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.16em] transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-violet-500/50 bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] text-white shadow-[0_20px_50px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 hover:brightness-110`
      : `${base} border border-slate-300 bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-slate-50`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-500">Panel operativo</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{hubName}</h3>
        </div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">En vivo</span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.82fr_1fr]">
        <div className="rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_45%),linear-gradient(180deg,#111827_0%,#030712_100%)] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-violet-200">Orden activa</p>
              <h4 className="mt-3 text-3xl font-black tracking-tight">FIX-00214</h4>
            </div>
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-200">En reparación</span>
          </div>
          <div className="mt-5 rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cliente</p>
                <p className="mt-1 font-semibold text-white">Seguimiento real</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipo</p>
                <p className="mt-1 font-semibold text-white">Dispositivo ingresado</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</p>
                <p className="mt-1 font-semibold text-white">Taller sincronizado</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Canal</p>
                <p className="mt-1 font-semibold text-white">WhatsApp + portal</p>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="uppercase tracking-[0.2em] text-slate-400">Recepción</p>
              <p className="mt-2 text-lg font-black text-white">1</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="uppercase tracking-[0.2em] text-slate-400">Diagnóstico</p>
              <p className="mt-2 text-lg font-black text-white">2</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="uppercase tracking-[0.2em] text-slate-400">Entrega</p>
              <p className="mt-2 text-lg font-black text-white">3</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-500">Seguimiento</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Portal del cliente, timeline y PDF real en un solo flujo.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-500">Inventario</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Refacciones, alertas y entradas ligadas al tenant.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-500">Cobros</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Mercado Pago, webhook y estados en Supabase.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-violet-500">WhatsApp</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">El enlace lleva al portal con el folio precargado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobilePortalPreview() {
  return (
    <div className="mx-auto w-full max-w-[20rem] rounded-[2.4rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
      <div className="rounded-[1.9rem] bg-white p-4 text-slate-950">
        <p className="text-xs uppercase tracking-[0.28em] text-violet-500">Portal del cliente</p>
        <h4 className="mt-2 text-xl font-black tracking-tight">Consulta tu reparación</h4>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Folio</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900">FIX-00214</p>
        </div>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estado</p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">En reparación</p>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          <div className="rounded-xl bg-emerald-100 px-2 py-2 text-emerald-700">Recibido</div>
          <div className="rounded-xl bg-emerald-100 px-2 py-2 text-emerald-700">Diagnóstico</div>
          <div className="rounded-xl bg-violet-100 px-2 py-2 text-violet-700">Proceso</div>
          <div className="rounded-xl bg-slate-100 px-2 py-2">Entrega</div>
        </div>
        <button className="mt-4 w-full rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(99,102,241,0.25)]">
          Consultar
        </button>
        <p className="mt-3 text-xs leading-5 text-slate-500">Acceso público para que el cliente vea el estado de su orden sin iniciar sesión.</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f4ef] text-slate-950">
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] text-lg font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.22)]">
              {brandShort.slice(0, 2)}
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-600/80">SaaS para talleres</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{productName}</h1>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="#funciones" className="transition hover:text-slate-950">Funciones</Link>
            <Link href="#precios" className="transition hover:text-slate-950">Precios</Link>
            <Link href="#portal" className="transition hover:text-slate-950">Portal</Link>
            <Link href="#contacto" className="transition hover:text-slate-950">Contacto</Link>
            <Link href="/login" className="rounded-full px-4 py-2 transition hover:bg-slate-100 hover:text-slate-950">Iniciar sesión</Link>
            <CTA href="/onboarding">Probar {trialDays} días gratis</CTA>
          </nav>
        </header>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:px-8 lg:pt-8">
        <div className="space-y-8 pt-4 lg:pt-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            {hubName} para talleres de reparación
          </div>

          <div className="space-y-5">
            <h2 className="max-w-xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Controla tu taller
              <span className="block bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] bg-clip-text text-transparent">sin perder tiempo.</span>
            </h2>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Órdenes, clientes, inventario, evidencias, WhatsApp y cobros conectados a un SaaS real multi-tenant. Todo en un solo lugar para operar sin improvisar.
            </p>
          </div>

          <ul className="grid gap-3 text-slate-800 sm:grid-cols-2">
            {[
              "Clientes",
              "Reparaciones",
              "Inventario",
              "Cobros",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">•</span>
                <span className="font-medium">{item}.</span>
              </li>
            ))}
          </ul>

          <p className="text-lg text-slate-700">Todo en un solo lugar.</p>

          <div className="flex flex-wrap gap-4">
            <CTA href="/onboarding">Probar {trialDays} días gratis</CTA>
            <Link href="#portal" className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50">
              Ver demostración
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-slate-500">
            {[
              "Sin tarjeta de crédito",
              "Sin instalación",
              "Listo en minutos",
              "Soporte real por WhatsApp",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-violet-500">◌</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 lg:pt-0">
          <DashboardPreview />
        </div>
      </section>

      <section id="funciones" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[2.6rem] bg-[#0b1020] px-5 py-8 text-white shadow-[0_30px_120px_rgba(15,23,42,0.28)] sm:px-8 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <SectionLabel>Diseñado para talleres modernos</SectionLabel>
              <h3 className="max-w-lg text-4xl font-black tracking-tight sm:text-5xl">
                Potente, simple y hecho para tu día a día.
              </h3>
              <p className="max-w-lg text-base leading-8 text-slate-300">
                Lo que necesitas para operar tu taller de reparación de celulares desde cualquier dispositivo, con la operación real conectada al backend.
              </p>
              <ul className="space-y-3 text-sm text-slate-200">
                {[
                  "Interfaz intuitiva y rápida",
                  "Funciona en cualquier dispositivo",
                  "Tus datos siempre seguros",
                  "Actualizaciones continuas",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="text-violet-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((card) => (
                <article key={card.title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="text-3xl text-violet-300">{card.icon}</div>
                  <h4 className="mt-4 text-xl font-black text-white">{card.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="portal" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-5 rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:p-8">
            <SectionLabel>Tus clientes siempre informados</SectionLabel>
            <h3 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Portal del cliente sin complicaciones.</h3>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              El cliente consulta el estatus de su reparación con su número de folio, sin registro y sin apps extra. El portal usa datos reales del backend.
            </p>
            <ul className="space-y-3 text-slate-700">
              {[
                "Consulta en tiempo real",
                "Fotos de cada etapa",
                "Notificaciones automáticas",
                "Más confianza, más clientes",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="text-violet-500">◌</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-6">
            <MobilePortalPreview />
          </div>
        </div>
      </section>

      <section id="precios" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Planes simples, precios justos</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Elige el plan ideal para tu taller</h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            Los planes abajo reflejan la estructura operativa disponible en la plataforma. El cobro real pasa por Mercado Pago y el backend confirma el estado.
          </p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] ${plan.featured ? "border-violet-400 ring-1 ring-violet-200" : "border-slate-200"}`}
            >
              {plan.featured ? (
                <span className="inline-flex rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white">Más popular</span>
              ) : null}
              <h4 className="mt-4 text-2xl font-black text-slate-950">{plan.name}</h4>
              <div className="mt-3 flex items-end gap-2 text-slate-950">
                <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                <span className="pb-1 text-sm font-medium text-slate-500">{plan.period}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="text-emerald-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <CTA href="/onboarding" variant={plan.featured ? "primary" : "secondary"}>
                Comenzar ahora
              </CTA>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-[#0b1020] px-6 py-7 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)] lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <SectionLabel>Empieza hoy y transforma la forma en que trabaja tu taller</SectionLabel>
            <p className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
              {productName} te deja operar con control real, sin seguir improvisando.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{trialDays} días gratis</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">Sin instalación</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">Activación en minutos</div>
            <CTA href="/onboarding">Crear mi taller ahora</CTA>
          </div>
        </div>
      </section>

      <section id="contacto" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionLabel>Contacto</SectionLabel>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Todo listo para venderse y operar</h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
              El marketing y la operación usan el mismo backend real. Si necesitas hablar con soporte, usa los contactos configurados del tenant o del SaaS.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Web pública", publicUrl || "No configurada"],
              ["Panel administrativo", adminUrl || "No configurado"],
              ["Correo", contactEmail || "No configurado"],
              ["WhatsApp", contactPhone || "No configurado"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-violet-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8">
        <PublicPortalLookup
          title="Portal del cliente"
          subtitle="Consulta el folio real de una reparación para ver el estado actualizado, documentos y timeline."
          showTenantInput={true}
        />
      </section>
    </main>
  );
}
