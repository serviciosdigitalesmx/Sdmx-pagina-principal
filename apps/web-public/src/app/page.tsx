import Link from "next/link";

const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "FIXI";
const legalName = process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Servicios Digitales MX";
const brandShort = process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "FXI";
const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL ?? "contacto@serviciosdigitalesmx.com";
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;
const starterPrice = process.env.NEXT_PUBLIC_SAAS_STARTER_PRICE ?? "$300 MXN";
const growthPrice = process.env.NEXT_PUBLIC_SAAS_GROWTH_PRICE ?? "$450 MXN";
const enterprisePrice = process.env.NEXT_PUBLIC_SAAS_ENTERPRISE_PRICE ?? "$600 MXN";
const tenantLabel = process.env.NEXT_PUBLIC_SAAS_TENANT_COUNT ?? "tenant_id";
const roleLabel = process.env.NEXT_PUBLIC_SAAS_ROLE_COUNT ?? "roles";
const branchLabel = process.env.NEXT_PUBLIC_SAAS_BRANCH_COUNT ?? "sucursales";

const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;
const whatsappHref = contactPhone ? `https://wa.me/${contactPhone.replace(/\D/g, "")}` : undefined;
const demoHref = demoUrl ?? contactEmailHref ?? "#contacto";
const supportEmailLabel = contactEmail ?? "Configurar correo de soporte";
const supportPhoneLabel = contactPhone ?? "Configurar teléfono de soporte";
const demoMailtoHref = contactEmail
  ? `mailto:${contactEmail}?subject=${encodeURIComponent(`Demo de ${productName}`)}&body=${encodeURIComponent(
      "Hola, quiero agendar una demo y ver cómo quedaría mi tenant con branding propio."
    )}`
  : "#contacto";

const serviceBlocks = [
  {
    title: "Cotiza y recibe",
    copy: "Captura el equipo, define el diagnóstico y convierte el primer contacto en una orden clara.",
  },
  {
    title: "Consulta el estado",
    copy: "El cliente sigue su reparación, ve avances y entiende qué pasa sin perseguir al taller.",
  },
  {
    title: "Mesa de control",
    copy: "Recepción, stock, finanzas, roles y sucursales en un entorno separado por tenant_id.",
  },
];

const metrics = [
  { value: "Cotizar", label: "Entrada comercial" },
  { value: "Tracking", label: "Consulta de estado" },
  { value: "Panel", label: "Control interno" },
];

const trustItems = [
  "Landing pública por tenant con dominio propio",
  "Integrador interno con módulos operativos reales",
  "Supabase + RLS + tenant_id como contrato de seguridad",
];

const quickEntries = [
  { label: "Cotizar", href: "/onboarding", copy: "Alta de tenant y arranque inmediato." },
  { label: "Ver estado", href: "/login", copy: "Acceso al panel del cliente con sesión segura." },
  { label: "WhatsApp", href: whatsappHref ?? contactEmailHref ?? "#contacto", copy: "Contacto directo para cerrar más rápido." },
  { label: "Panel", href: "/dashboard", copy: "Cockpit interno de recepción y operación." },
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.16),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(94,157,201,0.14),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_52%,#f8fafc_52%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white/90 px-6 py-5 text-slate-900 shadow-[0_18px_60px_rgba(31,41,55,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(44,110,159,0.20),rgba(255,255,255,0.96))] text-sm font-black text-slate-900 shadow-[0_18px_40px_rgba(31,41,55,0.08)]">
                {brandShort}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-cyan-700">Taller OS multitenant</p>
                <p className="mt-1 text-sm text-slate-500">{legalName}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              <a className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" href="#servicios">
                Servicios
              </a>
              <a className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" href="#planes">
                Planes
              </a>
              <a className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" href="#confianza">
                Confianza
              </a>
              <a className="rounded-full px-4 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900" href="#contacto">
                Contacto
              </a>
              <Link className="rounded-full border border-[#2c6e9f]/30 bg-[#2c6e9f]/10 px-5 py-3 font-semibold text-[#245a82] transition hover:bg-[#2c6e9f]/15 hover:border-[#2c6e9f]/50" href="/onboarding">
                Crear tenant
              </Link>
            </nav>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-12 shadow-[0_40px_140px_rgba(31,41,55,0.08)] sm:px-8 lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]" />
          <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#2c6e9f]/20 bg-[#2c6e9f]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#245a82]">
                Landing pública por tenant
              </p>
              <h1 className="mt-6 max-w-4xl text-balance text-5xl font-black uppercase leading-[0.92] tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl [font-family:var(--font-cormorant)]">
                <span className="sm:hidden">
                  {productName} para talleres que cotizan, rastrean y operan premium.
                </span>
                <span className="hidden bg-gradient-to-r from-[#2c6e9f] via-[#5e9dc9] to-[#1b9e5e] bg-clip-text text-transparent sm:block">
                  {productName} para talleres que
                  <span className="block">quieren cotizar, rastrear y operar premium.</span>
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                <span className="sm:hidden">
                  Cotización, tracking y control interno en un solo flujo.
                </span>
                <span className="hidden sm:inline">
                  {productName} convierte la operación de taller en una experiencia clara de cotización, tracking y control interno, con
                  marca propia por tenant y separación estricta de datos por tenant_id.
                </span>
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="rounded-full bg-[#2c6e9f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245a82]" href="/onboarding">
                  Crear mi tenant
                </Link>
                <a className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#2c6e9f]/40 hover:bg-slate-50" href={demoMailtoHref}>
                  Cotizar
                </a>
                <a className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href={whatsappHref ?? demoHref}>
                  WhatsApp
                </a>
                <Link className="rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href="/dashboard">
                  Panel
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <article key={metric.label} className="rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5">
                    <p className="text-3xl font-black text-slate-950">{metric.value}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{metric.label}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(31,41,55,0.08)]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-700">Suite interna</p>
                <h2 className="mt-3 text-2xl font-bold text-slate-950">Mesa de control del taller</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Recepción, técnico, solicitudes, archivo, clientes, stock, compras, gastos, finanzas y reportes con flujo real y
                  lectura operativa.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Tenant", value: tenantLabel },
                    { label: "Roles", value: roleLabel },
                    { label: "Sucursales", value: branchLabel },
                    { label: "Seguridad", value: "RLS + tenant_id" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section id="contacto" className="grid gap-5 rounded-[2.5rem] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_70px_rgba(31,41,55,0.08)] lg:grid-cols-[1fr_0.95fr] lg:px-10 lg:py-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-700">Entrada rápida</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl [font-family:var(--font-cormorant)]">
              Cotización, estado y panel sin perder el contexto del negocio.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              La homepage debe llevar al usuario a cotizar, revisar estado, abrir WhatsApp o entrar al panel con una lectura inmediata de
              taller.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {quickEntries.map((entry) => (
              <a key={entry.label} href={entry.href} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-[#2c6e9f]/30">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">{entry.label}</p>
                <p className="mt-3 text-base font-semibold text-slate-950">{entry.copy}</p>
              </a>
            ))}
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
              Cada tenant con su propia marca, sus propios accesos y su propia operación
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
                  ? "border-[#2c6e9f]/30 bg-[linear-gradient(180deg,rgba(44,110,159,0.10),rgba(255,255,255,1))] ring-1 ring-[#2c6e9f]/20"
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

        <section id="confianza" className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-slate-900 px-6 py-8 text-white shadow-[0_24px_90px_rgba(31,41,55,0.18)] lg:grid-cols-[1fr_0.85fr] lg:px-10 lg:py-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245a82]">Confianza</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl [font-family:var(--font-cormorant)]">
              La experiencia debe verse sólida antes de que el usuario siquiera entre al panel
            </h2>
            <ul className="mt-6 space-y-3">
              {trustItems.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <span className="mt-1 h-3 w-3 rounded-full bg-[#2c6e9f]" />
                  <span className="text-sm leading-7 text-slate-200">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Contacto</p>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-slate-400">Email</p>
                <p className="mt-1 text-base font-medium text-white">{supportEmailLabel}</p>
              </div>
              <div>
                <p className="text-slate-400">Teléfono</p>
                <p className="mt-1 text-base font-medium text-white">{supportPhoneLabel}</p>
              </div>
              <div>
                <p className="text-slate-400">Conversión</p>
                <p className="mt-1 text-base font-medium text-white">Branding por tenant y suite interna sincronizados.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="rounded-full bg-[#2c6e9f] px-5 py-3 font-semibold text-white transition hover:bg-[#245a82]" href="/onboarding">
                Probar tenant
              </Link>
              <a className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10" href={contactEmailHref ?? "#contacto"}>
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
