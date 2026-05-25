import Link from "next/link";

export default function Home() {
  const demoTenant = "demo";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_80%_10%,_rgba(249,115,22,0.10),_transparent_24%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] px-4 py-8 text-zinc-100">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-300">
              FIXIE · Portal del cliente
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
              Consulta real de tu orden
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Ingresa al portal del taller para revisar una orden real por folio, ver su estado, timeline y datos
              del servicio.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Acceso rápido</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Si ya conoces tu taller, entra directo al portal.
            </p>
            <Link
              href={`/t/${demoTenant}/portal`}
              className="mt-4 inline-flex rounded-full bg-violet-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-violet-300"
            >
              Probar portal demo
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Cómo entra el cliente</p>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>1. Abre el portal del taller desde el enlace público.</li>
              <li>2. Ingresa el folio de recepción.</li>
              <li>3. Consulta el estado real de la orden.</li>
              <li>4. Revisa timeline, equipo y canales de contacto.</li>
            </ol>
          </div>

          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-300">Ruta disponible</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              El portal está disponible por tenant en:
            </p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm font-semibold text-zinc-50">
              /t/[tenantSlug]/portal
            </div>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              El acceso depende del taller que consulta la orden.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>Portal del cliente para talleres multi-tenant.</p>
          <div className="flex flex-wrap gap-4">
            <span>Sin panel interno</span>
            <span>Datos reales</span>
            <span>Consulta por folio</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
