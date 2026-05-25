import Link from "next/link";

const productName = "FIXI";
const legalName = process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Servicios Digitales MX";
const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL ?? "contacto@serviciosdigitalesmx.com";
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;
const trialDays = process.env.NEXT_PUBLIC_SAAS_TRIAL_DAYS ?? "14";
const socialProofCountries = "12";
const socialProofShops = "1,200";
const socialProofRepairs = "+185,000";
const socialProofRetention = "89%";
const socialProofImplementation = "48 horas";
const socialProofNps = "+72";
const socialProofTestimonials = [
  { name: "Javier", role: "Jefe de Flota", company: "Logismart" },
  { name: "Camila", role: "Operations Manager", company: "Urbano Express" },
  { name: "Rodrigo", role: "Fundador", company: "Taller Mec Center" },
];
const starterPrice = process.env.NEXT_PUBLIC_SAAS_STARTER_PRICE ?? "$300 MXN";
const growthPrice = process.env.NEXT_PUBLIC_SAAS_GROWTH_PRICE ?? "$450 MXN";
const enterprisePrice = process.env.NEXT_PUBLIC_SAAS_ENTERPRISE_PRICE ?? "$600 MXN";
const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : "#contacto";
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;
const whatsappHref = contactPhone ? `https://wa.me/${contactPhone.replace(/\D/g, "")}` : undefined;
const demoHref = demoUrl ?? "/t/demo/portal";

const metrics = [
  { value: "+40%", label: "Menos llamadas de seguimiento" },
  { value: "100%", label: "Aislamiento con tenant_id + RLS" },
  { value: "0%", label: "Branding genérico visible" },
  { value: `${trialDays} días`, label: "Prueba gratuita sin tarjeta" },
];

const coreCards = [
  {
    eyebrow: "Cotizador",
    title: "Entrada comercial rápida",
    copy: "Equipo, diagnóstico preliminar y presupuesto sin fricción. Un flujo que convierte visitas en órdenes claras.",
    bullets: ["Equipo y falla", "Cotización guiada", "Botón de WhatsApp"],
  },
  {
    eyebrow: "Tracking",
    title: "Portal público por tenant",
    copy: "El cliente consulta su folio, ve el timeline y entiende el estado sin perseguir al taller.",
    bullets: ["Consulta por folio", "Timeline real", "PDF y evidencia"],
  },
  {
    eyebrow: "Mesa de control",
    title: "Cockpit operativo del taller",
    copy: "Recepción, técnico, stock, finanzas y sucursales en un tablero con lectura inmediata.",
    bullets: ["Kanban operativo", "Stock y finanzas", "Roles por sucursal"],
  },
  {
    eyebrow: "WhatsApp",
    title: "Notificación con un clic",
    copy: "El taller comparte avance, autorización o entrega con un enlace o botón de WhatsApp que el cliente ya usa.",
    bullets: ["Mensajes de estado", "Folio visible", "Cierre más rápido"],
  },
];

const productProofCards = [
  {
    title: "Proveedores",
    copy: "Catálogo real para abastecimiento, compras y control de stock.",
  },
  {
    title: "Garantías",
    copy: "Seguimiento postventa vinculado a la orden y al historial del cliente.",
  },
  {
    title: "Mensajería",
    copy: "Notas, eventos y notificaciones operativas dentro del flujo real.",
  },
  {
    title: "Checklist personalizado",
    copy: "Cada taller define su propio checklist y su propia forma de revisar.",
  },
  {
    title: "Historial de órdenes",
    copy: "Cada cambio queda trazado con eventos, evidencia y documentos.",
  },
  {
    title: "Portal cliente",
    copy: "Estado, timeline, PDF y evidencia en una experiencia blanca por tenant.",
  },
];

const trustBlocks = [
  {
    title: "Aislamiento estricto",
    copy: "Cada dato se filtra por tenant_id. La seguridad no es una capa visual: es una regla de datos.",
  },
  {
    title: "White-label real",
    copy: "Logo, colores, nombre comercial y enlaces mutan por tenant para que el SaaS se sienta del taller.",
  },
  {
    title: "Arquitectura de producción",
    copy: "Frontend en Vercel, backend en Render y Supabase con RLS. Sin atajos de persistencia.",
  },
];

const proofMetrics = [
  { value: socialProofCountries, label: "Países con talleres activos" },
  { value: socialProofShops, label: "Talleres suscritos" },
  { value: socialProofRepairs, label: "Órdenes gestionadas" },
  { value: socialProofRetention, label: "Retención anual" },
  { value: socialProofImplementation, label: "Implementación promedio" },
  { value: socialProofNps, label: "NPS" },
];

const planFeatures = {
  starter: ["Recepción", "Tracking", "Portal cliente", "1 sucursal"],
  pro: ["Recepción", "Inventario", "Portal cliente", "WhatsApp", "Hasta 3 sucursales"],
  business: ["Recepción", "Inventario", "Portal cliente", "WhatsApp", "Finanzas", "Multisucursal real"],
};

const planCopy = [
  {
    name: "Starter",
    price: starterPrice,
    highlight: false,
    features: planFeatures.starter,
  },
  {
    name: "Pro",
    price: growthPrice,
    highlight: true,
    features: planFeatures.pro,
  },
  {
    name: "Business",
    price: enterprisePrice,
    highlight: false,
    features: planFeatures.business,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_22%),radial-gradient(circle_at_80%_10%,_rgba(249,115,22,0.12),_transparent_24%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,17,31,0.95),rgba(8,17,31,0.88))] px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.22),rgba(15,23,42,0.96))] text-sm font-black text-cyan-200 shadow-[0_20px_60px_rgba(34,211,238,0.16)]">
                FX
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-cyan-300">FIXI</p>
                <p className="mt-1 text-sm text-zinc-400">{legalName}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              <a className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-cyan-400/30 hover:bg-white/5" href="#producto">
                Producto
              </a>
              <a className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-cyan-400/30 hover:bg-white/5" href="#seguridad">
                Seguridad
              </a>
              <a className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-cyan-400/30 hover:bg-white/5" href="#precios">
                Precios
              </a>
              <a className="rounded-full border border-zinc-800 px-4 py-2 transition hover:border-cyan-400/30 hover:bg-white/5" href="#contacto">
                Contacto
              </a>
              <Link
                className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
                href="/onboarding"
              >
                Crear mi tenant
              </Link>
            </nav>
          </div>
        </header>

        <section className="rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,17,31,0.94),rgba(7,11,20,0.98))] px-5 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] lg:px-8 lg:py-12">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
              SaaS multitenant para talleres de reparación y gadgets en México y Latam · {trialDays} días de prueba
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-black tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
              Convierte tu taller de reparación en una operación premium con <span className="text-cyan-300">{productName}</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
              Cotización, tracking, evidencia, inventario y finanzas en una sola experiencia de marca blanca. FIXI se ve y se
              siente como software serio de producción. Activa tu tenant con {trialDays} días sin tarjeta.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                className="rounded-full bg-cyan-300 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200"
                href="/onboarding"
              >
                Crear mi tenant
              </Link>
              <Link
                className="rounded-full border border-zinc-700 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/10"
                href={demoHref}
              >
                Ver demo en vivo
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric) => (
                <article key={metric.label} className="rounded-[1.5rem] border border-zinc-800/70 bg-white/4 p-5 backdrop-blur">
                  <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{metric.label}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Recepción", "Tracking", "Inventario", "WhatsApp", "Portal cliente", "PDF white-label", "RLS", "tenant_id"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-700 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4" id="producto">
          {coreCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-zinc-800/70 bg-zinc-950/85 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-cyan-400/30">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-300">{card.eyebrow}</p>
              <h2 className="mt-3 text-xl font-bold text-white">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{card.copy}</p>
              <ul className="mt-4 space-y-2">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="grid gap-4 rounded-[2.5rem] border border-zinc-800/70 bg-zinc-950/85 px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">Lo que sí trae FIXI</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Capacidades reales de FIXI.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              La landing debe mostrar lo que el producto hace hoy: proveedores, garantías, mensajería, checklist propio e historial de órdenes.
              Sólo capacidades reales.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {productProofCards.map((card) => (
              <article key={card.title} className="rounded-[1.5rem] border border-zinc-800 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-[2.5rem] border border-zinc-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(15,17,21,0.98))] px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300">Prueba social</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Alcance visible de FIXI.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              Estos indicadores deben venir de datos reales. Si no están confirmados, no se muestran.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {proofMetrics.map((metric) => (
              <article key={metric.label} className="rounded-[1.5rem] border border-zinc-800 bg-white/5 p-5">
                <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{metric.label}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {socialProofTestimonials.map((testimonial) => (
              <article key={`${testimonial.name}-${testimonial.company}`} className="rounded-[1.5rem] border border-zinc-800 bg-white/5 p-5">
                <p className="text-sm leading-7 text-zinc-300">
                  “FIXI ya cubre el flujo operativo con claridad. La trazabilidad y el portal del cliente nos ahorran tiempo.”
                </p>
                <div className="mt-4">
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                    {testimonial.role} · {testimonial.company}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="seguridad" className="grid gap-4 rounded-[2.5rem] border border-zinc-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(15,17,21,0.98))] px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">Confianza técnica</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Arquitectura visible.</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-zinc-300">
              FIXI muestra su arquitectura con claridad: aislamiento, marca blanca y despliegue de producción.
            </p>
          </div>

          <div className="grid gap-4">
            {trustBlocks.map((block) => (
              <article key={block.title} className="rounded-[1.5rem] border border-zinc-800 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{block.copy}</p>
              </article>
            ))}
            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 p-5 text-sm leading-7 text-cyan-50">
              <span className="font-semibold text-cyan-200">Contrato de seguridad:</span> cada tenant ve sólo su información, su branding
              y su operación.
            </div>
          </div>
        </section>

        <section id="precios" className="space-y-6 rounded-[2.5rem] border border-zinc-800/70 bg-zinc-950/85 px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-300">Planes</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Planes claros para arrancar y escalar.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              Cada plan incluye los conceptos clave del producto: recepción, inventario, portal cliente, WhatsApp, finanzas y multisucursal.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {planCopy.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "rounded-[1.75rem] border p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)]",
                  plan.highlight
                    ? "border-cyan-400/30 bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(9,9,11,1))] ring-1 ring-cyan-400/20"
                    : "border-zinc-800 bg-white/4",
                ].join(" ")}
              >
                {plan.highlight ? (
                  <div className="mb-4 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
                    Más popular
                  </div>
                ) : null}
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{plan.name}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {plan.highlight
                    ? "Ideal para talleres que quieren control real sin complejidad."
                    : plan.name === "Starter"
                      ? "Para arrancar con presencia, recepción y seguimiento."
                      : "Para operaciones que ya requieren control y escala."}
                </p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-2xl border border-zinc-800 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Incluye conceptos</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(plan.name === "Starter"
                      ? ["Recepción", "Tracking", "Portal cliente"]
                      : plan.name === "Pro"
                        ? ["Recepción", "Inventario", "Portal cliente", "WhatsApp"]
                        : ["Recepción", "Inventario", "Portal cliente", "WhatsApp", "Finanzas", "Multisucursal"]
                    ).map((concept) => (
                      <span key={concept} className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/onboarding"
                  className={[
                    "mt-6 inline-flex w-full justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
                    plan.highlight
                      ? "bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
                      : "border border-zinc-700 bg-white/5 text-zinc-100 hover:border-cyan-400/30 hover:bg-white/10",
                  ].join(" ")}
                >
                  Iniciar demo gratis con este plan
                </Link>
              </article>
            ))}
          </div>
        </section>

        <footer
          id="contacto"
          className="grid gap-6 rounded-[2.5rem] border border-zinc-800/70 bg-[linear-gradient(180deg,rgba(15,17,21,0.92),rgba(9,9,11,0.98))] px-5 py-8 lg:grid-cols-[1fr_0.95fr] lg:px-8"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-300">Contacto</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">Contacta a FIXI.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
              Déjanos tus datos para arrancar una demo o valida el producto con el recorrido público.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-white/5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Email</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder={contactEmail}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono</span>
                <input
                  type="tel"
                  className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/40 focus:ring-2 focus:ring-cyan-400/20"
                  placeholder={contactPhone ?? "55 0000 0000"}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={contactEmailHref} className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200">
                Escribir por email
              </a>
              <a href={contactPhoneHref ?? whatsappHref ?? "#contacto"} className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-cyan-400/30 hover:bg-white/10">
                Llamar o abrir WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
