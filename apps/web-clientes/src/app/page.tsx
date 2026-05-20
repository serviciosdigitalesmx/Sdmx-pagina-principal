import Link from "next/link";

export default function Home() {
  const demoTenant = "demo";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.18),_transparent_32%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_42%,#ffffff_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#245a82]">
              Portal del cliente
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">
              Consulta real de tu orden
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Ingresa al portal del taller para revisar una orden real por folio, ver su estado, timeline y datos
              del servicio.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Acceso rápido</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Si ya conoces tu tenant, entra directo al portal multi-tenant.
            </p>
            <Link
              href={`/t/${demoTenant}/portal`}
              className="mt-4 inline-flex rounded-full bg-[#2c6e9f] px-5 py-3 font-semibold text-white transition hover:bg-[#245a82]"
            >
              Probar portal demo
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245a82]">Cómo entra el cliente</p>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>1. Abre el portal del taller desde el enlace público.</li>
              <li>2. Ingresa el folio de recepción.</li>
              <li>3. Consulta el estado real de la orden.</li>
              <li>4. Revisa timeline, equipo y canales de contacto.</li>
            </ol>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#245a82]">Ruta soportada</p>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              El portal está disponible por tenant en:
            </p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-900">
              /t/[tenantSlug]/portal
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              El acceso depende de <span className="font-semibold text-slate-950">tenant_id</span> y responde
              contra backend real.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Portal del cliente para talleres multi-tenant.</p>
          <div className="flex flex-wrap gap-4">
            <span>Sin panel interno</span>
            <span>Sin datos simulados</span>
            <span>Consulta por folio</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
