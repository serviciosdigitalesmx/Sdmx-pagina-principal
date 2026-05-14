const tenantName = process.env.NEXT_PUBLIC_TENANT_BRAND_NAME ?? "Marca del taller";
const supportEmail = process.env.NEXT_PUBLIC_TENANT_SUPPORT_EMAIL;
const supportPhone = process.env.NEXT_PUBLIC_TENANT_SUPPORT_PHONE;

const supportEmailHref = supportEmail ? `mailto:${supportEmail}` : undefined;
const supportPhoneHref = supportPhone ? `tel:${supportPhone.replace(/\s+/g, "")}` : undefined;

const quickActions = [
  {
    title: "Soporte del taller",
    description: "Canal directo para incidencias operativas o dudas de uso.",
    href: supportEmailHref ?? "#support",
    label: "Contactar soporte",
  },
  {
    title: "Guía rápida",
    description: "Revisa el flujo mínimo para usar el sistema sin perder tiempo.",
    href: "#how-it-works",
    label: "Ver guía",
  },
];

const steps = [
  "Crea o revisa la orden del vehículo.",
  "Asigna técnico, prioridad y fecha objetivo.",
  "Actualiza el estado y notifica al cliente.",
  "Consulta reportes y pendientes desde el panel interno.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#e2e8f0_55%,#f8fafc_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-white shadow-2xl shadow-slate-950/30 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Portal del tenant</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Bienvenido a {tenantName}
              </h1>
              <p className="mt-3 max-w-2xl text-slate-300">
                Esta es la capa operativa del taller. Aquí se entra a trabajar, no a vender software.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-300">Estado</p>
              <p className="mt-1 text-lg font-semibold text-cyan-300">Operación activa</p>
              <p className="text-sm text-slate-400">Tenant aislado por `tenant_id`</p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Acceso rápido
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">{action.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{action.description}</p>
              <span className="mt-6 inline-flex font-semibold text-cyan-800">
                {action.label} →
              </span>
            </a>
          ))}
        </section>

        <section
          id="how-it-works"
          className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-10"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">
              Guía rápida
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Flujo mínimo para trabajar todos los días.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              El objetivo del tenant es que el equipo entre, opere y salga sin fricción.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl bg-slate-50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 font-bold text-cyan-900">
                  0{index + 1}
                </div>
                <p className="pt-2 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="support"
          className="grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/25 lg:grid-cols-2 lg:p-10"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Soporte
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Contacto directo para incidencias operativas.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Este canal es para usuarios del taller. Si algo falla, se atiende por estos medios y se corrige en el backend real.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Email</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {supportEmail ?? "Configurar NEXT_PUBLIC_TENANT_SUPPORT_EMAIL"}
              </p>
              {supportEmailHref ? (
                <a className="mt-3 inline-block font-semibold text-cyan-300" href={supportEmailHref}>
                  Escribir correo
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Teléfono</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {supportPhone ?? "Configurar NEXT_PUBLIC_TENANT_SUPPORT_PHONE"}
              </p>
              {supportPhoneHref ? (
                <a className="mt-3 inline-block font-semibold text-cyan-300" href={supportPhoneHref}>
                  Llamar ahora
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Portal operativo para {tenantName}</p>
          <div className="flex flex-wrap gap-4">
            <a className="hover:text-slate-800" href="#support">
              Soporte
            </a>
            <span>Aislamiento por tenant y RLS activo</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
