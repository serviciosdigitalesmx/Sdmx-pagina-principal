const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "FIXI";
const legalName = process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Servicios Digitales MX";
const brandShort = process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "FXI";
const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL ?? "contacto@serviciosdigitalesmx.com";
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;
const starterPrice = process.env.NEXT_PUBLIC_SAAS_STARTER_PRICE ?? "$300 MXN";
const growthPrice = process.env.NEXT_PUBLIC_SAAS_GROWTH_PRICE ?? "$450 MXN";
const enterprisePrice = process.env.NEXT_PUBLIC_SAAS_ENTERPRISE_PRICE ?? "$600 MXN";

const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;
const demoHref = demoUrl ?? contactEmailHref ?? "#contact";
const demoMailtoHref = contactEmail
  ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Demo de ${productName}`)}&body=${encodeURIComponent(
      "Hola, quiero agendar una demo y ver cómo quedaría mi tenant con branding propio."
    )}`
  : "#contact";

const serviceBlocks = [
  {
    title: "Recepción y cotización",
    copy: "Captura rápida del equipo, diagnóstico, presupuesto y seguimiento desde el primer contacto.",
  },
  {
    title: "Portal del cliente",
    copy: "Estado en tiempo real, evidencia, aprobaciones y comunicación limpia en un solo lugar.",
  },
  {
    title: "Operación interna",
    copy: "Órdenes, clientes, stock, finanzas, reportes y seguridad con aislamiento por tenant_id.",
  },
];

const metrics = [
  { value: "24/7", label: "Disponibilidad operativa" },
  { value: "100%", label: "Aislamiento por tenant" },
  { value: "Multi", label: "Marca y sucursal" },
];

const trustItems = [
  "Landing pública por tenant con dominio propio",
  "Integrador interno con módulos operativos reales",
  "Supabase + RLS + tenant_id como contrato de seguridad",
];

const plans = [
  {
    name: "Starter",
    price: starterPrice,
    copy: "Para entrar rápido con una base clara de recepción, cliente y seguimiento.",
    accent: false,
  },
  {
    name: "Pro",
    price: growthPrice,
    copy: "Para equipos que necesitan automatización, visibilidad y mejor control diario.",
    accent: true,
  },
  {
    name: "Business",
    price: enterprisePrice,
    copy: "Para operación robusta con múltiples sucursales, permisos y crecimiento serio.",
    accent: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(212,175,55,0.18),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_52%,#f8fafc_52%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 px-6 py-5 text-white shadow-[0_30px_90px_rgba(2,6,23,0.32)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(34,211,238,0.28),rgba(15,23,42,0.96))] text-sm font-black text-cyan-50 shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
                {brandShort}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-cyan-300">SaaS multi-tenant</p>
                <p className="mt-1 text-sm text-slate-300">{legalName}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#servicios">
                Servicios
              </a>
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#planes">
                Planes
              </a>
              <a className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white" href="#confianza">
                Confianza
              </a>
              <a className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/18 hover:border-cyan-400/70" href="/onboarding">
                Crear tenant
              </a>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.95),rgba(15,23,42,0.98))] px-6 py-12 shadow-[0_40px_140px_rgba(2,6,23,0.5)] sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Landing pública por tenant
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl [font-family:var(--font-cormorant)]">
                El sistema operativo para talleres que
                <span className="block text-transparent bg-gradient-to-r from-cyan-200 via-white to-amber-200 bg-clip-text">
                  quieren verse y operar premium.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                {productName} unifica recepción, cotización, seguimiento, inventario, clientes, finanzas y soporte para que cada tenant
                tenga su propia experiencia de marca, con operación real y separación estricta por tenant_id.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" href="/onboarding">
                  Crear mi tenant
                </a>
                <a className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/50 hover:bg-white/10" href={demoMailtoHref}>
                  Agendar demo
                </a>
                <a className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/35 hover:bg-white/5" href={demoHref}>
                  Ver ejemplo
                </a>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <article key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/5 px-5 py-5">
                    <p className="text-3xl font-black text-white">{metric.value}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">{metric.label}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
              <div className="rounded-[1.5rem] border border-cyan-400/15 bg-slate-950 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Suite interna</p>
                <h2 className="mt-3 text-2xl font-bold text-white">Hub operativo</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Recepción, técnico, solicitudes, archivo, clientes, stock, compras, gastos, finanzas y reportes en una misma experiencia.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {["Recepción", "Clientes", "Stock", "Finanzas"].map((label) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-1 text-sm text-slate-300">Listo para flujo real.</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="servicios" className="grid gap-5 lg:grid-cols-3">
          {serviceBlocks.map((block) => (
            <article key={block.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Módulo</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{block.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{block.copy}</p>
            </article>
          ))}
        </section>

        <section id="planes" className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_70px_rgba(15,23,42,0.08)] lg:px-10 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-700">Planes</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl [font-family:var(--font-cormorant)]">
              Cada tenant con su propia marca, su propio nivel y su propia experiencia
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Diseñado para vender confianza, operar con claridad y crecer sin mezclar clientes, datos ni branding entre tenants.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "rounded-[2rem] border p-6 shadow-[0_18px_70px_rgba(15,23,42,0.08)]",
                  plan.accent
                    ? "border-cyan-300/40 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(255,255,255,1))] ring-1 ring-cyan-300/20"
                    : "border-slate-200 bg-white",
                ].join(" ")}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-700">{plan.name}</p>
                <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{plan.price}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{plan.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="confianza" className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_24px_90px_rgba(2,6,23,0.3)] lg:grid-cols-[1fr_0.85fr] lg:px-10 lg:py-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Confianza</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl [font-family:var(--font-cormorant)]">
              La experiencia debe verse sólida antes de que el usuario siquiera entre al panel
            </h2>
            <ul className="mt-6 space-y-3">
              {trustItems.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-cyan-300" />
                  <span className="text-sm leading-7 text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Contacto</p>
            <div className="mt-4 space-y-4 text-sm text-slate-300">
              <div>
                <p className="text-slate-400">Email</p>
                <p className="mt-1 text-base font-medium text-white">{contactEmail}</p>
              </div>
              <div>
                <p className="text-slate-400">Teléfono</p>
                <p className="mt-1 text-base font-medium text-white">{contactPhone ?? "Configurar"}</p>
              </div>
              <div>
                <p className="text-slate-400">Conversión</p>
                <p className="mt-1 text-base font-medium text-white">Branding por tenant y suite interna sincronizados.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" href="/onboarding">
                Probar tenant
              </a>
              <a className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10" href={contactEmailHref ?? "#contact"}>
                Escribir
              </a>
              {contactPhoneHref ? (
                <a className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10" href={contactPhoneHref}>
                  Llamar
                </a>
              ) : null}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
