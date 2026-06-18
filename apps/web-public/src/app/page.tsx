import Link from "next/link";
import { optionalEnv } from "@white-label/config";
import { RootAuthHashRedirect } from "@/components/root-auth-hash-redirect";
import { resolveAdminUrl } from "@/lib/admin-url";

const productName = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_NAME") ?? "FIXI";
const brandShort = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT") ?? "FX";
const hubName = optionalEnv("NEXT_PUBLIC_HUB_NAME") ?? "Hub";
const adminUrl = optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ?? "";
const publicUrl = optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ?? "";
const trialDays = optionalEnv("NEXT_PUBLIC_SAAS_TRIAL_DAYS") ?? "7";
const contactEmail = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_EMAIL") ?? "";
const contactPhone = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_PHONE") ?? "";
const adminBaseUrl = resolveAdminUrl();
const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";
const adminOnboardingUrl = adminBaseUrl ? `${adminBaseUrl}/login?mode=signup` : "/login?mode=signup";

// FIXI branding is driven by production env vars so the landing stays consistent across deploys.

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
    description: "Notificaciones y enlaces directos al cliente.",
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
    description: "Para talleres que quieren arrancar con recepción y operación básica.",
    features: ["Órdenes ilimitadas", "WhatsApp integrado", "Panel administrativo"],
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
    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-400/90">{children}</p>
  );
}

function CTA({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.16em] transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-sky-500/50 bg-[linear-gradient(135deg,#38bdf8_0%,#2563eb_100%)] text-white shadow-[0_20px_50px_rgba(59,130,246,0.28)] hover:-translate-y-0.5 hover:brightness-110`
      : `${base} border border-slate-300 bg-white text-slate-950 hover:-translate-y-0.5 hover:bg-slate-50`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function GoogleCTA({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-900 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
    >
      <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
        <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
        <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
        <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
      </svg>
      {children}
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-500">Panel operativo</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{hubName}</h3>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">En vivo</span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.82fr_1fr]">
        <div className="rounded-[1.6rem] bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_45%),linear-gradient(180deg,#111827_0%,#030712_100%)] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-sky-200">Orden activa</p>
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
                <p className="mt-1 font-semibold text-white">WhatsApp + seguimiento</p>
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
            <p className="text-xs uppercase tracking-[0.24em] text-sky-500">Seguimiento</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Flujos operativos reales conectados al backend.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-500">Inventario</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Refacciones, alertas y entradas ligadas al tenant.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-500">Cobros</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Mercado Pago, webhook y estados en Supabase.</p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-sky-500">WhatsApp</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">El enlace lleva al seguimiento con el folio precargado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <RootAuthHashRedirect />
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/90 px-5 py-4 shadow-[0_18px_60px_rgba(2,6,23,0.45)] backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] text-lg font-black text-white shadow-[0_18px_40px_rgba(99,102,241,0.22)]">
              {brandShort.slice(0, 2)}
            </div>
            <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-400/80">SaaS para talleres</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-50">{productName}</h1>
          </div>
        </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
            <Link href="#funciones" className="transition hover:text-white">Funciones</Link>
            <Link href="#precios" className="transition hover:text-white">Precios</Link>
            <Link href="#contacto" className="transition hover:text-white">Contacto</Link>
            <Link href={adminLoginUrl} className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">Iniciar sesión</Link>
            <CTA href={adminOnboardingUrl}>Probar {trialDays} días gratis</CTA>
          </nav>
        </header>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-12 pt-2 sm:px-6 lg:grid-cols-[1.03fr_0.97fr] lg:px-8 lg:pt-8">
        <div className="space-y-8 pt-4 lg:pt-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {hubName} para talleres de reparación
          </div>

          <div className="space-y-5">
            <h2 className="max-w-xl text-5xl font-black tracking-tight text-slate-50 sm:text-6xl lg:text-7xl">
              Controla tu taller
              <span className="block bg-[linear-gradient(135deg,#7c3aed_0%,#4f46e5_100%)] bg-clip-text text-transparent">sin perder tiempo.</span>
            </h2>
            <p className="max-w-xl text-lg leading-8 text-slate-300">
              Órdenes, clientes, inventario, evidencias, WhatsApp y cobros conectados a un SaaS real multi-tenant. Todo en un solo lugar para operar sin improvisar.
            </p>
          </div>

          <ul className="grid gap-3 text-slate-200 sm:grid-cols-2">
            {[
              "Clientes",
              "Reparaciones",
              "Inventario",
              "Cobros",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-[0_10px_30px_rgba(2,6,23,0.28)]">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-300">•</span>
                <span className="font-medium">{item}.</span>
              </li>
            ))}
          </ul>

          <p className="text-lg text-slate-300">Todo en un solo lugar.</p>

          <div className="flex flex-wrap gap-4">
            <CTA href={adminOnboardingUrl}>Probar {trialDays} días gratis</CTA>
            <GoogleCTA href="/auth/google">Continuar con Google</GoogleCTA>
            <Link href="#contacto" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-6 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-900">
              Ver demostración
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            {[
              "Sin tarjeta de crédito",
              "Sin instalación",
              "Listo en minutos",
              "Soporte real por WhatsApp",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-sky-500">◌</span>
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
            <div className="rounded-[2.6rem] border border-slate-800 bg-[#0b1020] px-5 py-8 text-white shadow-[0_30px_120px_rgba(2,6,23,0.45)] sm:px-8 lg:px-10">
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
                    <span className="text-sky-400">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featureCards.map((card) => (
                <article key={card.title} className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <div className="text-3xl text-sky-300">{card.icon}</div>
                  <h4 className="mt-4 text-xl font-black text-white">{card.title}</h4>
                  <p className="mt-2 text-sm leading-7 text-slate-300">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="precios" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel>Planes simples, precios justos</SectionLabel>
            <h3 className="mt-3 text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">Elige el plan ideal para tu taller</h3>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-300">
            Los planes abajo reflejan la estructura operativa disponible en la plataforma. El cobro real pasa por Mercado Pago y el backend confirma el estado.
          </p>
        </div>

        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article
              key={plan.name}
              className={`rounded-[2rem] border bg-slate-950/90 p-6 shadow-[0_20px_70px_rgba(2,6,23,0.45)] ${plan.featured ? "border-sky-400 ring-1 ring-sky-400/20" : "border-slate-800"}`}
            >
              {plan.featured ? (
                <span className="inline-flex rounded-full bg-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white">Más popular</span>
              ) : null}
              <h4 className="mt-4 text-2xl font-black text-slate-50">{plan.name}</h4>
              <div className="mt-3 flex items-end gap-2 text-slate-50">
                <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                <span className="pb-1 text-sm font-medium text-slate-400">{plan.period}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">{plan.description}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-200">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="text-emerald-500">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            <CTA href={adminOnboardingUrl} variant={plan.featured ? "primary" : "secondary"}>
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
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{trialDays} días gratis</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">Sin instalación</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">Activación en minutos</div>
            <CTA href={adminOnboardingUrl}>Crear mi taller ahora</CTA>
            <GoogleCTA href="/auth/google">Crear con Google</GoogleCTA>
          </div>
        </div>
      </section>

      <section id="contacto" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-[2rem] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_20px_70px_rgba(2,6,23,0.45)] lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionLabel>Contacto</SectionLabel>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-50">Todo listo para venderse y operar</h3>
            <p className="mt-4 max-w-xl text-base leading-8 text-slate-300">
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
              <div key={label} className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-500">{label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-50">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
