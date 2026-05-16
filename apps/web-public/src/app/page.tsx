const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "FIXI";
const legalName = process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Servicios Digitales MX";
const brandShort = process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "FXI";

const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const loginUrl = "/login";
const companyId = process.env.NEXT_PUBLIC_SAAS_COMPANY_ID;
const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL ?? "FIXI@SERVICIOSDIGITALESMX.COM";
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;

const starterPrice = process.env.NEXT_PUBLIC_SAAS_STARTER_PRICE ?? "$300 MXN";
const growthPrice = process.env.NEXT_PUBLIC_SAAS_GROWTH_PRICE ?? "$450 MXN";
const enterprisePrice = process.env.NEXT_PUBLIC_SAAS_ENTERPRISE_PRICE ?? "$600 MXN";

const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;
const demoHref = demoUrl ?? contactEmailHref ?? "#contact";
const demoMailtoHref = contactEmail
  ? `mailto:${contactEmail}?subject=${encodeURIComponent("Solicitud de demo FIXI")}&body=${encodeURIComponent(
      "Hola, quiero agendar una demo de FIXI. ¿Me pueden compartir disponibilidad?"
    )}`
  : "#contact";

const chips = ["Facturación", "Inventario", "Clientes", "WhatsApp", "Finanzas", "Rastreo", "Reportes", "Soporte"];

const metrics = [
  { value: "+32", label: "Estados en México" },
  { value: "+150,000", label: "Órdenes creadas" },
  { value: "24/7", label: "Operación continua" },
];

const features = [
  "Recepción profesional y panel técnico",
  "Portal del cliente para seguimiento automático",
  "Control de notificaciones, stock y compras",
  "Finanzas completas con Mercado Pago",
  "Sistema de referidos para todos los planes",
];

const trustSignals = [
  "Flujo claro desde el primer contacto hasta la operación diaria",
  "Arquitectura orientada a multi-tenant con separación por tenant_id",
  "Contacto comercial directo con respuesta por correo",
];

const planItems = [
  {
    name: "Plan Esencial",
    price: starterPrice,
    subtitle: "Operación clara sin fricción.",
    accent: "Desde el primer día",
    body: "Para talleres que quieren una base sólida para capturar clientes, registrar órdenes y dar seguimiento con consistencia.",
    features: ["Clientes y órdenes", "Notificaciones base", "Acceso operativo"],
    cta: "Comenzar ahora",
    featured: false,
  },
  {
    name: "Plan Pro",
    price: growthPrice,
    subtitle: "Automatización invisible para equipos que crecen.",
    accent: "Elección del operador experto",
    body: "Diseñado para quienes ya operan con volumen y necesitan más visibilidad sin añadir complejidad al día a día.",
    features: ["Panel completo", "Automatizaciones", "Seguimiento avanzado"],
    cta: "Lo quiero ya",
    featured: true,
  },
  {
    name: "Plan Business",
    price: enterprisePrice,
    subtitle: "Para operación robusta y multi-sucursal.",
    accent: "Control total",
    body: "Pensado para equipos que requieren trazabilidad, permisos, soporte y una implementación con mayor acompañamiento.",
    features: ["Multi-sucursal", "Permisos y roles", "Acompañamiento"],
    cta: "Hablar con ventas",
    featured: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent text-white">
      <section className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-[#d4af37]/15 bg-[#0d1320]/80 px-5 py-4 shadow-[0_24px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4af37]/30 bg-[linear-gradient(180deg,rgba(212,175,55,0.25),rgba(17,19,31,0.95))] text-sm font-black text-[#f5efe1] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                {brandShort}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#d4af37]/90">
                  SaaS multi-tenant para talleres
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Operación, clientes, inventario y finanzas en un solo sistema.
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#features">
                Características
              </a>
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#plans">
                Planes
              </a>
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#trust">
                Confianza
              </a>
              <a className="rounded-full border border-[#d4af37]/40 bg-transparent px-5 py-3 font-semibold text-[#f5efe1] transition hover:bg-[#d4af37]/10 hover:border-[#d4af37]/70" href="/onboarding">
                Crear cuenta
              </a>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[36px] border border-[#d4af37]/12 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_30%),radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.10),transparent_24%),linear-gradient(180deg,#0b101c_0%,#070b12_100%)] px-5 py-12 shadow-[0_40px_140px_rgba(0,0,0,0.58)] sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-28 [background-image:linear-gradient(rgba(212,175,55,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.08)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-[#d4af37]/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 shadow-lg shadow-black/10"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="max-w-5xl">
              <p className="mx-auto mb-5 inline-flex rounded-full border border-[#d4af37]/25 bg-[#d4af37]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#f3df9f]">
                Acceso directo a una operación más ordenada
              </p>
              <h1 className="text-balance text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl [font-family:var(--font-display)]">
                {productName}. El sistema operativo para talleres que
                <br />
                ya no compiten por precio.
                <span className="block text-transparent bg-gradient-to-r from-[#f3df9f] via-[#d4af37] to-[#8f6b1f] bg-clip-text">
                  Una experiencia más precisa.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {productName} centraliza recepción, seguimiento, inventario, clientes y finanzas en una sola plataforma para talleres que
                buscan una operación impecable, visible y fácil de sostener.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a className="rounded-full border border-[#d4af37]/40 bg-[#d4af37]/10 px-6 py-3 text-sm font-semibold text-[#f3df9f] transition hover:bg-[#d4af37]/18 hover:border-[#d4af37]/75 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_12px_30px_rgba(212,175,55,0.14)]" href="/onboarding">
                  Comenzar ahora
                </a>
                <a
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-[#d4af37]/50 hover:bg-white/10"
                  href={demoMailtoHref}
                >
                  Solicitar demo
                </a>
                <a className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/35 hover:bg-white/5" href={loginUrl}>
                  Iniciar sesión
                </a>
              </div>
            </div>

            <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[24px] border border-[#d4af37]/12 bg-[#111827]/80 px-6 py-7 shadow-[0_12px_50px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d4af37]/30 hover:shadow-[0_18px_60px_rgba(0,0,0,0.4)]"
                >
                  <p className="text-4xl font-black tracking-tight text-white sm:text-5xl">{metric.value}</p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{metric.label}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="grid gap-8 rounded-[36px] border border-[#d4af37]/10 bg-[#0f1624] px-5 py-8 shadow-[0_18px_80px_rgba(0,0,0,0.32)] lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10"
        >
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">Características</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl [font-family:var(--font-display)]">
                Lo que hace que una operación se sienta de alto nivel
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Diseñamos la plataforma para que atender clientes, registrar órdenes y dar seguimiento se sienta fluido, serio y
                consistente en cada paso.
              </p>
            </div>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#d4af37]/25 hover:bg-white/[0.06]">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.45)]" />
                  <span className="text-sm font-semibold text-slate-100 sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-[#d4af37]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4">
            <div className="rounded-[24px] border border-white/10 bg-[#111827]/90 p-5 shadow-inner shadow-black/30">
              <div className="rounded-3xl border border-[#d4af37]/12 bg-[#0b101c] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#d4af37]/90">Vista operativa</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-white">Panel completo</p>
                  </div>
                  <div className="rounded-full border border-[#d4af37]/20 bg-[#d4af37]/10 px-3 py-1 text-xs font-semibold text-[#f3df9f]">En vivo</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Recepción", "Ordenes y clientes"],
                    ["Inventario", "Stock y compras"],
                    ["Finanzas", "Pagos y cortes"],
                    ["Notificaciones", "WhatsApp y alertas"],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#d4af37]/25">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-300">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="space-y-6 rounded-[36px] border border-[#d4af37]/10 bg-[#0f1624] px-5 py-8 lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">Planes de pago</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl [font-family:var(--font-display)]">Elige la experiencia que tu operación necesita</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Cada plan responde a una etapa distinta de madurez operativa. Los precios mantienen claridad comercial desde el primer
              vistazo.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {planItems.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "relative flex h-full flex-col rounded-[28px] border p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_90px_rgba(0,0,0,0.38)]",
                  plan.featured
                    ? "border-[#d4af37]/35 bg-[linear-gradient(180deg,rgba(212,175,55,0.12),rgba(17,25,39,0.96))] ring-1 ring-[#d4af37]/20 lg:-mt-1 lg:scale-[1.02]"
                    : "border-white/10 bg-[#111827]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">{plan.name}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{plan.accent}</h3>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full bg-[#d4af37] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                      Recomendado
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300">{plan.subtitle}</p>
                <p className="mt-4 text-5xl font-black tracking-tight text-white">{plan.price}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{plan.body}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-100">
                      <span className={`h-2.5 w-2.5 rounded-full ${plan.featured ? "bg-[#d4af37]" : "bg-cyan-300"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  className={[
                    "mt-8 rounded-full border px-5 py-3 text-center text-sm font-semibold transition duration-200",
                    plan.featured
                      ? "border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f3df9f] hover:bg-[#d4af37]/18 hover:shadow-[0_0_0_1px_rgba(212,175,55,0.2),0_12px_30px_rgba(212,175,55,0.14)]"
                      : "border-white/10 bg-white/5 text-white hover:border-[#d4af37]/30 hover:bg-white/10",
                  ].join(" ")}
                  href="/onboarding"
                >
                  {plan.cta}
                </a>
                <p className="mt-3 text-xs text-slate-400">{plan.featured ? "Sin permanencia. Facturación mensual." : "Facturación mensual."}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="rounded-[36px] border border-[#d4af37]/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_34%),linear-gradient(180deg,#0f1624_0%,#090d15_100%)] px-5 py-8 lg:px-10 lg:py-10"
        >
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">Señales de confianza</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl [font-family:var(--font-display)]">Lo que hace que FIXI se sienta serio desde el primer vistazo</h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-slate-300">
              Lenguaje, estructura y contacto directo alineados para transmitir orden, claridad y una presentación de alto nivel.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {trustSignals.map((signal) => (
              <article key={signal} className="rounded-[28px] border border-white/10 bg-white/6 p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#d4af37]/25 hover:bg-white/[0.06]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#f3df9f] to-[#d4af37] text-sm font-black text-slate-950 shadow-[0_10px_30px_rgba(212,175,55,0.24)]">
                  ✓
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-200">{signal}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="grid gap-5 rounded-[36px] border border-[#d4af37]/10 bg-[#0f1624] px-5 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">Contacto</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl [font-family:var(--font-display)]">Contacta al equipo correcto</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Si quieres conocer FIXI o agendar una demo, usa los canales oficiales de contacto. La experiencia ya está preparada para
              responder de forma clara y directa.
            </p>
            <div className="mt-6 rounded-[24px] border border-[#d4af37]/12 bg-[#111827]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Razón social</p>
              <p className="mt-2 text-lg font-semibold text-white">{legalName}</p>
              {companyId ? <p className="mt-1 text-sm text-slate-400">{companyId}</p> : null}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[#d4af37]/12 bg-[#111827]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Email</p>
              <p className="mt-2 text-lg font-semibold text-white">{contactEmail}</p>
              {contactEmailHref ? (
                <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={contactEmailHref}>
                  Contacto comercial
                </a>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-[#d4af37]/12 bg-[#111827]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Atención</p>
              <p className="mt-2 text-lg font-semibold text-white">{contactPhone ?? "Atención por correo"}</p>
              {contactPhoneHref ? (
                <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={contactPhoneHref}>
                  Llamar ahora
                </a>
              ) : (
                <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={contactEmailHref ?? "#contact"}>
                  Escribir correo
                </a>
              )}
            </div>
            <div className="rounded-[24px] border border-[#d4af37]/12 bg-[#111827]/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Demo</p>
              <p className="mt-2 text-lg font-semibold text-white">{demoUrl ?? "Solicítala por correo"}</p>
              <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={demoMailtoHref}>
                Solicitar demo
              </a>
              <p className="mt-2 text-xs text-slate-400">Atención prioritaria por correo para nuevos proyectos.</p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-white/10 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {productName}. {legalName}
          </p>
          <div className="flex flex-wrap gap-4">
            <a className="transition hover:text-white" href="#plans">
              Planes
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contacto
            </a>
            <a className="transition hover:text-white" href={loginUrl}>
              Iniciar sesión
            </a>
            <a className="transition hover:text-white" href="/onboarding">
              Probar
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
