import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,#08111f_0%,#0f172a_48%,#020617_100%)] px-4 py-8 text-zinc-100">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Web cliente</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Landing del tenant + portal del cliente</h1>
        <p className="max-w-2xl text-lg leading-8 text-zinc-300">
          Esta app vive por tenant. Entra usando la ruta de tu taller para ver la landing pública y el portal del cliente.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/t/demo/portal" className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
            Ver portal de ejemplo
          </Link>
          <Link href="/t/demo" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10">
            Ver landing de ejemplo
          </Link>
        </div>
      </section>
    </main>
  );
}
