const tenantName = process.env.NEXT_PUBLIC_TENANT_BRAND_NAME ?? "Marca del taller";
const supportEmail = process.env.NEXT_PUBLIC_TENANT_SUPPORT_EMAIL;
const supportPhone = process.env.NEXT_PUBLIC_TENANT_SUPPORT_PHONE;

const supportEmailHref = supportEmail ? `mailto:${supportEmail}` : undefined;
const supportPhoneHref = supportPhone ? `tel:${supportPhone.replace(/\s+/g, "")}` : undefined;

const modules = [
  { title: "Recepción", copy: "Entrada de equipo, cotización y seguimiento." },
  { title: "Técnico", copy: "Diagnóstico, avances y notas internas." },
  { title: "Clientes", copy: "Historial, contacto y trazabilidad." },
  { title: "Stock", copy: "Existencias, compras y alertas." },
  { title: "Finanzas", copy: "Ingresos, gastos y cortes." },
  { title: "Seguridad", copy: "Roles, permisos y auditoría." },
];

const steps = [
  "Captura o consulta la orden en recepción.",
  "Asigna técnico y prioriza el trabajo.",
  "Actualiza estados y notifica al cliente.",
  "Revisa stock, finanzas y reportes sin salir del panel.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(212,175,55,0.12),_transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_54%,#f8fafc_54%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/92 p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.34)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Suite interna</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-cormorant)]">
                Bienvenido a {tenantName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Esta capa es la operación del tenant. La experiencia debe sentirse premium, rápida y enfocada a trabajo real.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:grid-cols-3 lg:min-w-[420px]">
              {[
                ["Estado", "Activa"],
                ["Contexto", "Aislado"],
                ["Tenant", "Verificado"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <article key={module.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-700">Módulo</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{module.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{module.copy}</p>
            </article>
          ))}
        </section>

        <section
          id="how-it-works"
          className="grid gap-6 rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[0.92fr_1.08fr] lg:p-10"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Flujo</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">
              Un recorrido corto para operar todos los días sin fricción.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              El objetivo del tenant es que recepción, técnico y administración trabajen con la misma claridad visual.
            </p>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-bold text-cyan-300">
                  0{index + 1}
                </div>
                <p className="pt-2 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2.25rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_70px_rgba(2,6,23,0.3)] lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-300">Soporte</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight [font-family:var(--font-cormorant)]">
              Contacto directo para incidencias y una salida elegante al cliente final.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Cada tenant debe poder operar, atender y escalar sin perder consistencia visual ni control de acceso.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Email</p>
              <p className="mt-1 text-lg font-semibold text-white">{supportEmail ?? "Configurar NEXT_PUBLIC_TENANT_SUPPORT_EMAIL"}</p>
              {supportEmailHref ? (
                <a className="mt-3 inline-block font-semibold text-cyan-300" href={supportEmailHref}>
                  Escribir correo
                </a>
              ) : null}
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Teléfono</p>
              <p className="mt-1 text-lg font-semibold text-white">{supportPhone ?? "Configurar NEXT_PUBLIC_TENANT_SUPPORT_PHONE"}</p>
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
            <a className="hover:text-slate-800" href="#how-it-works">
              Flujo
            </a>
            <span>Tenant aislado por `tenant_id`</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
