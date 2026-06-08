import Link from "next/link";

export default function PortalEntryPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.14),_transparent_26%),linear-gradient(180deg,#050505_0%,#0f0f10_50%,#141210_100%)] px-4 py-8 text-zinc-50">
      <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">Portal del cliente</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
          Consulta pública por folio
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          El portal real se abre desde la ruta del tenant o desde el enlace compartido por el taller. Esta página no pide el nombre del taller para no exponer información innecesaria.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-stone-700/70 bg-black/20 p-5">
            <p className="text-sm font-semibold text-zinc-100">Para clientes</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              Abre el enlace que te compartió el taller y escribe tu folio en el portal correspondiente.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-stone-700/70 bg-black/20 p-5">
            <p className="text-sm font-semibold text-zinc-100">Para talleres</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              El portal se personaliza desde el panel del tenant. Ahí puedes configurar la landing y el acceso público.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-amber-50 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-100">
            Volver al inicio
          </Link>
          <Link href="/login" className="rounded-full border border-stone-700 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}
