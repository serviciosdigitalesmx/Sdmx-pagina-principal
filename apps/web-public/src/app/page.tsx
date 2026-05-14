const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "Plataforma SaaS";
const legalName =
  process.env.NEXT_PUBLIC_SAAS_LEGAL_NAME ?? "Razón social disponible bajo solicitud";
const foundedYear = "2025";

const contactEmail = process.env.NEXT_PUBLIC_SAAS_CONTACT_EMAIL;
const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;
const demoUrl = process.env.NEXT_PUBLIC_SAAS_DEMO_URL;
const companyId = process.env.NEXT_PUBLIC_SAAS_COMPANY_ID;

const contactEmailHref = contactEmail ? `mailto:${contactEmail}` : undefined;
const contactPhoneHref = contactPhone ? `tel:${contactPhone.replace(/\s+/g, "")}` : undefined;

const plans = [
  {
    name: "Starter",
    price: "Desde plan de entrada",
    description: "Para talleres pequeños que necesitan orden, agenda y seguimiento por WhatsApp.",
    features: ["Alta de clientes y vehículos", "Seguimiento de órdenes", "Notificaciones operativas"],
    cta: "Probar gratis 14 días",
  },
  {
    name: "Growth",
    price: "Plan profesional",
    description: "Para equipos que ya venden mantenimiento recurrente y necesitan control diario.",
    features: ["Panel multiusuario", "Reportes operativos", "Automatizaciones y recordatorios"],
    cta: "Ver demo",
  },
  {
    name: "Enterprise",
    price: "A medida",
    description: "Para grupos de talleres con procesos, integraciones y soporte prioritario.",
    features: ["Implementación guiada", "Roles y permisos", "Integraciones y SLA"],
    cta: "Hablar con ventas",
  },
];

const steps = [
  "Registra tu taller y configura usuarios, servicios y canales de atención.",
  "Da de alta un vehículo y crea una orden con trazabilidad completa.",
  "Automatiza avisos por WhatsApp y centraliza el seguimiento.",
  "Mide tiempos, carga de trabajo y estado de cada servicio desde un solo panel.",
];

const trustPoints = [
  "Supabase con RLS y tenant_id",
  "HTTPS, JWT y validación en backend",
  "Backups y auditoría de cambios",
  "Separación clara entre SaaS y tenant apps",
];

const faqs = [
  {
    q: "¿Esto es el SaaS o el panel del taller?",
    a: "Esta página es la capa pública comercial del SaaS. El panel operativo vive aparte por tenant.",
  },
  {
    q: "¿Hay prueba gratis?",
    a: "Sí. La propuesta comercial contempla prueba gratis para acelerar demos y cierres.",
  },
  {
    q: "¿Cómo trabajan los datos?",
    a: "Con aislamiento por tenant_id y políticas RLS en Supabase para evitar cruces de información.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_32%),linear-gradient(180deg,#09111f_0%,#0f172a_42%,#f8fafc_42%,#f8fafc_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/90 px-6 py-5 text-white shadow-2xl shadow-slate-950/30 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">SaaS para talleres mecánicos</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950">
                {process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "WB"}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{productName}</h1>
                <p className="text-sm text-slate-300">
                  Software de gestión para talleres mecánicos con automatización por WhatsApp.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <a className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" href="#pricing">
              Probar gratis 14 días
            </a>
            <a className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10" href={demoUrl ?? "#contact"}>
              Ver demo
            </a>
          </div>
        </header>

        <section className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
          <div className="flex flex-col justify-center gap-6">
            <div className="inline-flex w-fit rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-900">
              Fundado en {foundedYear}. Operación real para talleres reales.
            </div>
            <div className="space-y-5">
              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                Gestiona órdenes, clientes y seguimiento operativo desde un panel pensado para vender más servicio y perder menos tiempo.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {productName} es el SaaS público para talleres que necesitan una plataforma profesional, con aislamiento por tenant, proceso claro y una experiencia lista para demo comercial.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a className="rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800" href="#pricing">
                Ver precios
              </a>
              <a className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50" href="#about">
                Nosotros
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Estado comercial</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Early access con demos reales</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Identidad legal</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{legalName}</p>
                <p className="text-sm text-slate-500">{companyId ?? "Registro fiscal disponible bajo solicitud"}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/25">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-300">Captura comercial</p>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Panel SaaS</p>
                  <p className="mt-1 font-semibold">Operaciones, clientes y trazabilidad por taller</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Canal clave</p>
                  <p className="mt-1 font-semibold">WhatsApp automático para avisos y seguimiento</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Seguridad</p>
                  <p className="mt-1 font-semibold">Supabase RLS + JWT + auditoría</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">Confianza</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{point}</p>
            </div>
          ))}
        </section>

        <section id="about" className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Nosotros</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Marca comercial pensada para vender confianza, no solo software.</h3>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              La presentación pública de un SaaS debe parecer una empresa operativa. Por eso esta landing separa el producto, el equipo, el soporte y el cumplimiento legal del panel tenant.
            </p>
            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Empresa</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{legalName}</p>
              <p className="text-sm text-slate-500">Año de fundación {foundedYear}</p>
              <p className="text-sm text-slate-500">Contacto fiscal: {companyId ?? "pendiente de publicar"}</p>
            </div>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl border border-slate-200 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 font-bold text-cyan-900">
                  {index + 1}
                </div>
                <p className="pt-2 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Precios</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Un precio visible acelera demos y reduce fricción comercial.</h3>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Los importes finales se publican desde variables de entorno para que la oferta comercial pueda cambiar sin tocar el código.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className="flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">{plan.name}</p>
                <h4 className="mt-3 text-2xl font-semibold text-slate-950">{plan.price}</h4>
                <p className="mt-3 text-slate-600">{plan.description}</p>
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a className="mt-auto pt-6 font-semibold text-cyan-800" href="#contact">
                  {plan.cta} →
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/25 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Cómo funciona</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight">Proceso simple, sin humo.</h3>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-bold text-slate-950">
                  0{index + 1}
                </div>
                <p className="pt-2 text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Contacto y soporte</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Un SaaS vende mejor cuando el contacto es inmediato y visible.</h3>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Si el contacto todavía no está publicado, estas rutas salen de variables de entorno y se pueden conectar a correo, WhatsApp Business o formulario real sin tocar la UI.
            </p>
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

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">FAQ</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Preguntas que un comprador serio va a hacer.</h3>
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
            <a href="#about" className="hover:text-slate-800">
              Nosotros
            </a>
            <a href="#pricing" className="hover:text-slate-800">
              Precios
            </a>
            <a href="#contact" className="hover:text-slate-800">
              Contacto
            </a>
            <span>Aviso legal y privacidad aplicables al SaaS</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
