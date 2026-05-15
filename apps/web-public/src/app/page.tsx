const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "Plataforma SaaS";
const legalName =
  process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Razón social disponible bajo solicitud";

const brandShort = process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "WB";
const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;
const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;
const loginUrl = adminUrl ?? appUrl ?? "/onboarding";
const companyId = process.env.NEXT_PUBLIC_SAAS_COMPANY_ID;
const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL;
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;

const starterPrice = process.env.NEXT_PUBLIC_SAAS_STARTER_PRICE ?? "$300 MXN";
const growthPrice = process.env.NEXT_PUBLIC_SAAS_GROWTH_PRICE ?? "$450 MXN";
const enterprisePrice = process.env.NEXT_PUBLIC_SAAS_ENTERPRISE_PRICE ?? "$600 MXN";

const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;

const outcomes = [
  "Ordena clientes, equipos y seguimiento en un solo panel.",
  "Evita cruces de información con tenant_id y RLS en Supabase.",
  "Convierte más con recordatorios, WhatsApp y trazabilidad operativa.",
];

const proofPoints = [
  "Alta en minutos",
  "Multiusuario por taller",
  "Listo para ventas y operación",
  "Pensado para escalar",
];

const plans = [
  {
    name: "Starter",
    price: starterPrice,
    description: "Para talleres pequeños que reparan celulares, tablets y equipos básicos sin perder el control.",
    features: [
      "Captura de clientes y órdenes",
      "Seguimiento básico por WhatsApp",
      "Acceso para dueño y equipo",
    ],
    cta: "Empezar prueba",
    featured: false,
  },
  {
    name: "Growth",
    price: growthPrice,
    description: "Para talleres que ya facturan y necesitan ver operación, ventas y carga diaria con claridad.",
    features: [
      "Panel comercial y operativo",
      "Reportes y seguimiento por estado",
      "Automatizaciones y recordatorios",
    ],
    cta: "Ver demo",
    featured: true,
  },
  {
    name: "Enterprise",
    price: enterprisePrice,
    description: "Para grupos de talleres de celulares y computadoras que requieren soporte, procesos y configuración a medida.",
    features: [
      "Implementación guiada",
      "Roles, permisos y auditoría",
      "Integraciones y acompañamiento",
    ],
    cta: "Hablar con ventas",
    featured: false,
  },
];

const results = [
  {
    title: "Más cierres",
    text: "La página deja clara la oferta, el flujo y el punto de entrada comercial.",
  },
  {
    title: "Menos fricción",
    text: "El visitante entiende en segundos qué hace el producto, cuánto cuesta y cómo probarlo.",
  },
  {
    title: "Más confianza",
    text: "Se muestran contacto, legal, seguridad y arquitectura real sin relleno.",
  },
];

const faqs = [
  {
    q: "¿Qué problema resuelve?",
    a: "Centraliza la operación de un taller de reparación: clientes, órdenes, seguimiento y comunicación comercial.",
  },
  {
    q: "¿Dónde veo el precio?",
    a: "En la sección de planes. Los importes salen de variables de entorno para no tocar el código al cambiar la oferta.",
  },
  {
    q: "¿Cómo empiezo?",
    a: "Con la prueba gratis y el onboarding conectado al API real.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(15,23,42,0.12),_transparent_22%),linear-gradient(180deg,#07111f_0%,#0f172a_46%,#f8fafc_46%,#f8fafc_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-6 lg:px-10">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 px-6 py-5 text-white shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
                {brandShort}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">SaaS para talleres de reparación</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">{productName}</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-300">
                  Vende más servicio, organiza mejor la operación y sigue cada orden con una plataforma pensada para talleres de celulares, computadoras y electrónica.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <a className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" href="/onboarding">
                Probar gratis
              </a>
              <a className="rounded-full border border-cyan-300 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-white/10" href={loginUrl}>
                Iniciar sesión
              </a>
              <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10" href="#pricing">
                Ver precios
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-8 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 lg:grid-cols-[1.08fr_0.92fr] lg:p-10">
          <div className="flex flex-col justify-center gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-900">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              Prueba gratis disponible
            </div>

            <div className="space-y-5">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                La portada que convierte visitantes en demos, y demos en cierres para talleres de celulares y computadoras.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {productName} presenta una oferta clara para talleres de reparación: qué resuelve, cuánto cuesta y cómo empezar hoy. Sin humo, sin vaguedades y sin dejar dudas de que es un SaaS real.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800" href="/onboarding">
                Comenzar prueba
              </a>
              <a className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href={loginUrl}>
                Iniciar sesión
              </a>
              <a className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href={demoUrl ?? "#contact"}>
                Pedir demo
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {proofPoints.map((point) => (
                <div key={point} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {point}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/25">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Por qué compra un taller</p>
              <div className="mt-4 space-y-3">
                {outcomes.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 p-4">
                    <p className="text-sm text-slate-300">Beneficio real</p>
                    <p className="mt-1 font-semibold">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {results.map((item) => (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Impacto</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section id="pricing" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Precios</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Paquetes claros para cerrar más rápido.
            </h3>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Los precios salen de variables de entorno. Si no están configurados, el sitio lo muestra de forma explícita para no inventar cifras.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`flex h-full flex-col rounded-[1.9rem] border p-6 shadow-sm ${
                  plan.featured
                    ? "border-cyan-300 bg-slate-950 text-white shadow-2xl shadow-cyan-950/20"
                    : "border-slate-200 bg-white text-slate-950"
                }`}
              >
                <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${plan.featured ? "text-cyan-300" : "text-cyan-700"}`}>
                  {plan.name}
                </p>
                <h4 className="mt-3 text-3xl font-semibold tracking-tight">{plan.price}</h4>
                <p className={`mt-3 leading-7 ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className={`mt-1 h-2 w-2 rounded-full ${plan.featured ? "bg-cyan-300" : "bg-cyan-500"}`} />
                      <span className={plan.featured ? "text-slate-200" : "text-slate-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  className={`mt-8 rounded-full px-5 py-3 text-center font-semibold transition ${
                    plan.featured
                      ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                      : "bg-slate-950 text-white hover:bg-slate-800"
                  }`}
                  href="/onboarding"
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/25 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Cómo vende</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">
              Un visitante necesita entender el valor en menos de 10 segundos.
            </h3>
            <p className="mt-4 leading-8 text-slate-300">
              Esta estructura empuja a la acción con una jerarquía comercial real: problema, beneficio, precio, prueba y contacto.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Hero con promesa clara y CTA primario",
              "Bloque de precio visible sin rodeos",
              "Beneficios concretos y diferenciadores",
              "FAQ para resolver objeciones antes de vender",
            ].map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-slate-950">
                  0{index + 1}
                </div>
                <p className="pt-2 text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Contacto y cierre</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Un SaaS vende mejor cuando la siguiente acción es obvia.
            </h3>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Si quieres vender desde esta página, deja configurados los precios, el correo y el teléfono. La UI ya está lista para eso.
            </p>
            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Razón social</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{legalName}</p>
              <p className="text-sm text-slate-500">{companyId ?? "Configurar NEXT_PUBLIC_SAAS_COMPANY_ID"}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{contactEmail ?? "Configurar NEXT_PUBLIC_SAAS_CONTACT_EMAIL"}</p>
              {contactEmailHref ? (
                <a className="mt-3 inline-block font-semibold text-cyan-800" href={contactEmailHref}>
                  Escribir correo
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Teléfono</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{contactPhone ?? "Configurar NEXT_PUBLIC_SAAS_CONTACT_PHONE"}</p>
              {contactPhoneHref ? (
                <a className="mt-3 inline-block font-semibold text-cyan-800" href={contactPhoneHref}>
                  Llamar ahora
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Demo</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{demoUrl ?? "Configurar NEXT_PUBLIC_SAAS_DEMO_URL"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">FAQ</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Objeciones que la venta ya debe responder.</h3>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer text-lg font-semibold text-slate-950">{faq.q}</summary>
                <p className="mt-3 leading-7 text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-slate-200 py-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {productName}. {legalName}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#pricing" className="hover:text-slate-800">
              Precios
            </a>
            <a href={loginUrl} className="hover:text-slate-800">
              Iniciar sesión
            </a>
            <a href="#contact" className="hover:text-slate-800">
              Contacto
            </a>
            <a href="/onboarding" className="hover:text-slate-800">
              Probar
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
