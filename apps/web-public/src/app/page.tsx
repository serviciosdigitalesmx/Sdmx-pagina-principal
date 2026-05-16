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

const planItems = [
  {
    name: "Plan Esencial",
    price: starterPrice,
    subtitle: "Para arrancar con una operación clara y ordenada.",
    accent: "Desde el primer día",
    body: "Ideal para talleres pequeños que necesitan capturar clientes, registrar órdenes y dar seguimiento sin caos.",
    features: ["Clientes y órdenes", "Notificaciones base", "Acceso operativo"],
    cta: "Comenzar ahora",
    featured: false,
  },
  {
    name: "Plan Pro",
    price: growthPrice,
    subtitle: "El punto de control para crecer sin perder visibilidad.",
    accent: "Más vendido",
    body: "Pensado para equipos que ya venden y necesitan automatización, seguimiento comercial y más control.",
    features: ["Panel completo", "Automatizaciones", "Seguimiento avanzado"],
    cta: "Lo quiero ya",
    featured: true,
  },
  {
    name: "Plan Business",
    price: enterprisePrice,
    subtitle: "Para operación más robusta y multi-sucursal.",
    accent: "Control total",
    body: "Diseñado para quienes requieren procesos más amplios, trazabilidad, soporte y escalabilidad.",
    features: ["Multi-sucursal", "Permisos y roles", "Acompañamiento"],
    cta: "Hablar con ventas",
    featured: false,
  },
];

const testimonials = [
  {
    name: "Aarón C.",
    role: "Taller de celulares",
    text: "La operación quedó clara desde el primer vistazo. La página sí vende y no se ve genérica.",
  },
  {
    name: "Carlos M.",
    role: "Sucursal técnica",
    text: "Los planes, el flujo y la propuesta están directos. Se entiende rápido lo que se compra.",
  },
  {
    name: "María V.",
    role: "Operación y ventas",
    text: "El estilo oscuro y los bloques grandes se sienten más premium y ayudan a cerrar mejor.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#091427] text-white">
      <section className="mx-auto flex w-full max-w-[1240px] flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-[#0d1a33]/95 px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25">
                {brandShort}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-cyan-300/90">
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
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#testimonials">
                Testimonios
              </a>
              <a className="rounded-full bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400" href="/onboarding">
                Crear cuenta
              </a>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.22),transparent_35%),linear-gradient(180deg,#0b1730_0%,#091427_100%)] px-5 py-12 shadow-[0_30px_120px_rgba(0,0,0,0.45)] sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 shadow-lg shadow-black/10"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="max-w-5xl">
              <p className="mx-auto mb-5 inline-flex rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200">
                Operación real, no promesas vacías
              </p>
              <h1 className="text-balance text-5xl font-black uppercase leading-[0.92] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Convierte tu taller
                <br />
                en una
                <span className="block text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-300 bg-clip-text">
                  operación profesional
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {productName} centraliza recepción, seguimiento, inventario, clientes y finanzas en una sola plataforma para talleres que
                necesitan orden, visibilidad y atención profesional desde el primer contacto.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400" href="/onboarding">
                  Comenzar ahora
                </a>
                <a
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  href={demoMailtoHref}
                >
                  Solicitar demo
                </a>
                <a className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5" href={loginUrl}>
                  Iniciar sesión
                </a>
              </div>
            </div>

            <div className="mt-12 grid w-full gap-4 sm:grid-cols-3">
              {metrics.map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-[24px] border border-white/10 bg-white/5 px-6 py-7 shadow-[0_12px_50px_rgba(0,0,0,0.22)]"
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
          className="grid gap-8 rounded-[36px] border border-white/10 bg-[#0b1730] px-5 py-8 shadow-[0_18px_80px_rgba(0,0,0,0.3)] lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-10"
        >
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Características</p>
              <h2 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
                Todo lo que necesitas para operar con orden
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Diseñamos la plataforma para que puedas atender clientes, registrar órdenes y dar seguimiento sin depender de hojas sueltas
                o mensajes perdidos.
              </p>
            </div>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.65)]" />
                  <span className="text-sm font-semibold text-slate-100 sm:text-base">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4">
            <div className="rounded-[24px] border border-white/10 bg-[#101d39] p-5 shadow-inner shadow-black/30">
              <div className="rounded-3xl border border-white/10 bg-[#0b1730] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">Vista operativa</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-white">Panel completo</p>
                  </div>
                  <div className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">En vivo</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Recepción", "Ordenes y clientes"],
                    ["Inventario", "Stock y compras"],
                    ["Finanzas", "Pagos y cortes"],
                    ["Notificaciones", "WhatsApp y alertas"],
                  ].map(([title, desc]) => (
                    <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm text-slate-300">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="plans" className="space-y-6 rounded-[36px] border border-white/10 bg-[#0b1730] px-5 py-8 lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Planes de pago</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Elige el nivel de control que necesita tu taller</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Cada plan está pensado para una etapa distinta de operación. Los precios están definidos para mostrar claridad comercial desde
              el primer vistazo.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {planItems.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "relative flex h-full flex-col rounded-[28px] border p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]",
                  plan.featured
                    ? "border-orange-400/50 bg-[linear-gradient(180deg,rgba(249,115,22,0.16),rgba(16,29,57,0.96))] ring-1 ring-orange-400/30"
                    : "border-white/10 bg-[#101d39]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">{plan.name}</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{plan.accent}</h3>
                  </div>
                  {plan.featured ? (
                    <span className="rounded-full bg-orange-400 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-slate-950">
                      Más vendido
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-300">{plan.subtitle}</p>
                <p className="mt-4 text-5xl font-black tracking-tight text-white">{plan.price}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{plan.body}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-slate-100">
                      <span className={`h-2.5 w-2.5 rounded-full ${plan.featured ? "bg-orange-400" : "bg-cyan-300"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  className={[
                    "mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition",
                    plan.featured
                      ? "bg-orange-400 text-slate-950 hover:bg-orange-300"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
                  ].join(" ")}
                  href="/onboarding"
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section
          id="testimonials"
          className="rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,#0b1730_0%,#091427_100%)] px-5 py-8 lg:px-10 lg:py-10"
        >
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Prueba social</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Lo que el mercado ve cuando la página vende bien</h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-slate-300">
              Opiniones y resultados que ayudan a que un taller nuevo entienda rápidamente el valor del sistema y su forma de trabajo.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                <div className="flex gap-1 text-amber-400">
                  {"★★★★★".split("").map((star, index) => (
                    <span key={`${item.name}-${index}`}>{star}</span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-200">{item.text}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-300 text-sm font-black text-slate-950">
                    {item.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-slate-400">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="contact"
          className="grid gap-5 rounded-[36px] border border-white/10 bg-[#0b1730] px-5 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10 lg:py-10"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-300">Contacto</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">Contacta al equipo correcto</h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Si quieres conocer FIXI o agendar una demo, usa los canales oficiales de contacto. La experiencia ya está preparada para
              responder de forma clara y directa.
            </p>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Razón social</p>
              <p className="mt-2 text-lg font-semibold text-white">{legalName}</p>
              {companyId ? <p className="mt-1 text-sm text-slate-400">{companyId}</p> : null}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Email</p>
              <p className="mt-2 text-lg font-semibold text-white">{contactEmail}</p>
              {contactEmailHref ? (
                <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={contactEmailHref}>
                  Escribir correo
                </a>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
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
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">Demo</p>
              <p className="mt-2 text-lg font-semibold text-white">{demoUrl ?? "Solicítala por correo"}</p>
              <a className="mt-3 inline-block text-sm font-semibold text-cyan-300 transition hover:text-cyan-200" href={demoMailtoHref}>
                Solicitar demo
              </a>
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
