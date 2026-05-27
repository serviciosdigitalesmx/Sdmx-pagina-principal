import Link from "next/link";

function CTA({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-2xl border border-sky-400/70 bg-sky-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-sky-400"
      : "inline-flex items-center justify-center rounded-2xl border border-orange-400/80 bg-zinc-50 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-zinc-950 transition hover:-translate-y-0.5 hover:bg-zinc-100";
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function Home() {
  const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG?.trim() || "";
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_32%),radial-gradient(circle_at_80%_10%,_rgba(249,115,22,0.10),_transparent_24%),linear-gradient(180deg,#08111f_0%,#091428_46%,#070b14_100%)] px-4 py-8 text-zinc-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <header className="flex flex-col gap-5 rounded-[1.8rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.96))] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/80">Web del tenant</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-zinc-50 sm:text-6xl">
              Sitio web del taller
            </h1>
            <p className="mt-4 text-lg leading-8 text-zinc-300">
              Cada tenant tiene su propia landing, cotizador y acceso al portal del cliente para seguir reparaciones.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">Acceso rápido</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {tenantSlug ? "Entradas públicas para el tenant configurado." : "Define el tenant por configuración para habilitar el acceso rápido."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {tenantSlug ? (
                <>
                  <CTA href={`/${tenantSlug}`}>Ver landing</CTA>
                  <CTA href={`/${tenantSlug}/portal`} variant="secondary">
                    Ver estado
                  </CTA>
                </>
              ) : (
                <span className="rounded-2xl border border-zinc-700 px-5 py-4 text-sm text-zinc-400">
                  Configura `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          {[
            ["Landing", "Presentación del taller con branding, servicios, ubicación y contacto."],
            ["Cotizador", "Captura la falla y crea la solicitud inicial para recepción."],
            ["Portal", "Consulta por folio, ve el estatus y descarga el PDF real."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="mb-8 text-4xl text-sky-400">▣</div>
              <h2 className="text-2xl font-black uppercase tracking-[0.08em] text-zinc-50">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.95))] p-6 lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Integración multi-tenant</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-zinc-50 sm:text-4xl">
              Un sitio por tenant, no un portal suelto
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              La configuración real vive en el integrador interno. Este sitio sólo consume branding, contenido y rutas del tenant.
            </p>
          </div>

          <div className="rounded-[1.8rem] border border-sky-500/60 bg-zinc-950 p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Rutas</p>
            <div className="mt-4 space-y-3 text-sm">
              {tenantSlug ? (
                <>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">/{tenantSlug}</div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">/{tenantSlug}/portal</div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">/{tenantSlug}/cotizar</div>
                </>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">Tenant no configurado</div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
