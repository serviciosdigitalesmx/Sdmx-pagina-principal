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
const mobileAppDownloadHref = "https://docs.google.com/uc?export=download&id=1mWB6HdpHOv5le1Dmo19dEd0ejalaVLdP";

const metrics = [
  { value: "+40%", label: "Menos llamadas de seguimiento" },
  { value: "100%", label: "Aislamiento por taller" },
  { value: "0%", label: "Branding genérico visible" },
  { value: `${trialDays} días`, label: "Prueba gratuita sin tarjeta" },
];

const coreCards = [
  {
    eyebrow: "Cotizador",
    title: "Cotización guiada",
    copy: "Equipo, diagnóstico preliminar y presupuesto en un flujo que convierte visitas en órdenes claras.",
    bullets: ["Equipo y falla", "Cotización guiada", "Botón de WhatsApp"],
  },
  {
    eyebrow: "Tracking",
    title: "Portal público del taller",
    copy: "El cliente consulta su folio, ve el timeline y entiende el estado sin perseguir al taller.",
    bullets: ["Consulta por folio", "Timeline real", "PDF y evidencia"],
  },
  {
    eyebrow: "Mesa de control",
    title: "Centro de control del taller",
    copy: "Recepción, técnico, stock, finanzas y sucursales en un tablero claro y directo.",
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
    copy: "Estado, timeline, PDF y evidencia en una experiencia blanca del taller.",
  },
];

const mobileAppCards = [
  {
    title: "APK para Android",
    copy: "Instala FIXI en tu celular para probar el acceso móvil del taller con el frontend real.",
  },
  {
    title: "Sesión persistente",
    copy: "La app móvil conserva la misma sesión del taller para que no tengas que repetir el acceso.",
  },
  {
    title: "Descarga directa",
    copy: "Baja el APK desde Google Drive y compártelo por enlace cuando quieras instalarlo.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Configura tu taller",
    copy: "Activa tu espacio, ajusta tu marca y deja listo el entorno para operar.",
  },
  {
    step: "02",
    title: "Recibe y da seguimiento",
    copy: "Registra el ingreso, comparte avances y conserva evidencia en cada orden.",
  },
  {
    step: "03",
    title: "Comparte el portal",
    copy: "Tu cliente consulta su folio, su timeline y su PDF sin llamadas innecesarias.",
  },
];

const trustBlocks = [
  {
    title: "Aislamiento estricto",
    copy: "Cada taller mantiene sus datos privados y separados.",
  },
  {
    title: "White-label real",
    copy: "Logo, colores, nombre comercial y enlaces se adaptan a cada taller.",
  },
  {
    title: "Protección de datos",
    copy: "FIXI protege la información de cada taller con separación real entre cuentas.",
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(194,138,55,0.14),_transparent_22%),radial-gradient(circle_at_80%_10%,_rgba(194,138,55,0.08),_transparent_24%),linear-gradient(180deg,#050505_0%,#0f0f10_46%,#141210_100%)] text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-stone-500/15 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(12,12,12,0.90))] px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-500/20 bg-[linear-gradient(180deg,rgba(94,58,24,0.22),rgba(15,23,42,0.96))] text-sm font-black text-stone-100 shadow-[0_20px_60px_rgba(194,138,55,0.10)]">
                FX
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.42em] text-stone-300">FIXI</p>
                <p className="mt-1 text-sm text-zinc-400">{legalName}</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
              <a className="rounded-full border border-stone-800 px-4 py-2 transition hover:border-stone-500/30 hover:bg-white/5" href="#producto">
                Producto
              </a>
              <a className="rounded-full border border-stone-800 px-4 py-2 transition hover:border-stone-500/30 hover:bg-white/5" href="#seguridad">
                Seguridad
              </a>
              <a className="rounded-full border border-stone-800 px-4 py-2 transition hover:border-stone-500/30 hover:bg-white/5" href="#precios">
                Precios
              </a>
              <a className="rounded-full border border-stone-800 px-4 py-2 transition hover:border-stone-500/30 hover:bg-white/5" href="#contacto">
                Contacto
              </a>
              <Link
                className="rounded-full border border-stone-500/30 bg-stone-500/10 px-5 py-3 font-semibold text-stone-200 transition hover:border-stone-300/40 hover:bg-stone-500/15"
                href="/onboarding"
              >
                Crear mi tenant
              </Link>
            </nav>
          </div>
        </header>

        <section className="rounded-[2.5rem] border border-stone-500/15 bg-[linear-gradient(180deg,rgba(12,12,12,0.96),rgba(16,14,12,0.98))] px-5 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] lg:px-8 lg:py-12">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-stone-500/20 bg-stone-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-stone-200">
              Plataforma premium para talleres de reparación y gadgets · {trialDays} días de prueba
            </div>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-black tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
              Convierte tu taller en una operación premium con <span className="text-stone-300">{productName}</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
              Cotización, tracking, evidencia, inventario y finanzas en una sola experiencia de marca blanca. Activa tu espacio con {trialDays} días sin tarjeta.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                className="rounded-full bg-stone-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-stone-200"
                href="/onboarding"
              >
                Crear mi tenant
              </Link>
              <Link
                className="rounded-full border border-stone-700 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-stone-500/30 hover:bg-white/10"
                href={demoHref}
              >
                Ver demo en vivo
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
                <article key={metric.label} className="rounded-[1.5rem] border border-stone-800/70 bg-white/4 p-5 backdrop-blur">
                  <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{metric.label}</p>
                </article>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["Recepción", "Tracking", "Inventario", "WhatsApp", "Portal cliente", "PDF", "Privacidad", "Marca blanca"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-stone-700 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-4" id="producto">
          {coreCards.map((card) => (
            <article key={card.title} className="rounded-[1.75rem] border border-stone-800/70 bg-zinc-950/85 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:border-stone-500/30">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-stone-300">{card.eyebrow}</p>
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

        <section
          id="app-movil"
          className="grid gap-4 rounded-[2.5rem] border border-stone-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.94),rgba(15,17,21,0.98))] px-5 py-8 lg:px-8"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">App móvil</p>
              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">FIXI también va en tu celular.</h2>
              <p className="mt-4 text-base leading-8 text-zinc-300">
                Descarga el APK de Android para probar la experiencia móvil real del taller con la misma cuenta y el mismo flujo.
              </p>
            </div>
            <a
              href={mobileAppDownloadHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-stone-100 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-stone-200"
            >
              Descargar APK de FIXI
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {mobileAppCards.map((card) => (
              <article key={card.title} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-[2.5rem] border border-stone-800/70 bg-zinc-950/85 px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Capacidades</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Todo lo que tu taller usa en un solo lugar.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              FIXI reúne operación, seguimiento y presentación en una experiencia diseñada para verse seria desde el primer vistazo.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {productProofCards.map((card) => (
              <article key={card.title} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-[2.5rem] border border-stone-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.94),rgba(15,17,21,0.98))] px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Cómo funciona</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Tres pasos para empezar sin fricción.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              La experiencia debe sentirse simple para el taller y clara para el cliente.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {howItWorks.map((item) => (
              <article key={item.step} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-300">{item.step}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-[2.5rem] border border-stone-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(15,17,21,0.98))] px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Adopción</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Alcance visible de FIXI.</h2>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              Estos indicadores deben venir de datos reales. Si no están confirmados, no se muestran.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {proofMetrics.map((metric) => (
              <article key={metric.label} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <p className="text-3xl font-black tracking-tight text-white">{metric.value}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">{metric.label}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {socialProofTestimonials.map((testimonial) => (
              <article key={`${testimonial.name}-${testimonial.company}`} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <p className="text-sm leading-7 text-zinc-300">
                  “Seguimos cada orden y el cliente revisa su estado sin llamadas innecesarias.”
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

        <section id="seguridad" className="grid gap-4 rounded-[2.5rem] border border-stone-800/70 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(15,17,21,0.98))] px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Confianza técnica</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl">Arquitectura visible.</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-zinc-300">
              FIXI muestra su arquitectura con claridad: aislamiento, marca blanca y despliegue de producción.
            </p>
          </div>

          <div className="grid gap-4">
            {trustBlocks.map((block) => (
              <article key={block.title} className="rounded-[1.5rem] border border-stone-800 bg-white/5 p-5">
                <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-400">{block.copy}</p>
              </article>
            ))}
            <div className="rounded-[1.5rem] border border-stone-500/20 bg-stone-500/10 p-5 text-sm leading-7 text-slate-50">
              <span className="font-semibold text-stone-200">Contrato de seguridad:</span> cada taller ve sólo su información, su branding
              y su operación.
            </div>
          </div>
        </section>

        <section id="precios" className="space-y-6 rounded-[2.5rem] border border-stone-800/70 bg-zinc-950/85 px-5 py-8 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Planes</p>
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
                    ? "border-stone-500/30 bg-[linear-gradient(180deg,rgba(194,138,55,0.12),rgba(9,9,11,1))] ring-1 ring-stone-400/20"
                    : "border-stone-800 bg-white/4",
                ].join(" ")}
              >
                {plan.highlight ? (
                  <div className="mb-4 inline-flex rounded-full border border-stone-500/30 bg-stone-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-stone-200">
                    Más popular
                  </div>
                ) : null}
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{plan.name}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-white">{plan.price}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {plan.highlight
                    ? "Ideal para talleres que quieren verse más serios y responder mejor."
                    : plan.name === "Starter"
                      ? "Para empezar con recepción, seguimiento y presencia profesional."
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
                <div className="mt-5 rounded-2xl border border-stone-800 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-300">Incluye conceptos</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(plan.name === "Starter"
                      ? ["Recepción", "Tracking", "Portal cliente"]
                      : plan.name === "Pro"
                        ? ["Recepción", "Inventario", "Portal cliente", "WhatsApp"]
                        : ["Recepción", "Inventario", "Portal cliente", "WhatsApp", "Finanzas", "Multisucursal"]
                    ).map((concept) => (
                      <span key={concept} className="rounded-full border border-stone-700 px-3 py-1 text-xs font-semibold text-zinc-200">
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
                      ? "bg-stone-100 text-zinc-950 hover:bg-stone-200"
                      : "border border-stone-700 bg-white/5 text-zinc-100 hover:border-stone-500/30 hover:bg-white/10",
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
          className="grid gap-6 rounded-[2.5rem] border border-stone-800/70 bg-[linear-gradient(180deg,rgba(15,17,21,0.92),rgba(9,9,11,0.98))] px-5 py-8 lg:grid-cols-[1fr_0.95fr] lg:px-8"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-stone-300">Contacto</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-white">Contacta a FIXI.</h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-300">
              Déjanos tus datos para arrancar una demo o valida el producto con el recorrido público.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-stone-800 bg-white/5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Email</span>
                <input
                  type="email"
                className="w-full rounded-2xl border border-stone-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-stone-500/40 focus:ring-2 focus:ring-stone-400/20"
                  placeholder={contactEmail}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-300">Teléfono</span>
                <input
                  type="tel"
                className="w-full rounded-2xl border border-stone-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-stone-500/40 focus:ring-2 focus:ring-stone-400/20"
                  placeholder={contactPhone ?? "55 0000 0000"}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={contactEmailHref} className="rounded-full bg-stone-100 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-stone-200">
                Escribir por email
              </a>
              <a href={contactPhoneHref ?? whatsappHref ?? "#contacto"} className="rounded-full border border-stone-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-stone-500/30 hover:bg-white/10">
                Llamar o abrir WhatsApp
              </a>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
