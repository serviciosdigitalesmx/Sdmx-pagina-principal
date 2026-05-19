import Link from "next/link";

const services = [
  ["Laptops & Surface", "Pantallas, teclado, placas y reparación avanzada."],
  ["Smartphones & Tablets", "Batería, puertos de carga, agua y microsoldadura."],
  ["Tarjetas de Video", "Diagnóstico y recuperación de GPUs de alto valor."],
];

export default function TenantLandingPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = params.tenant;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_30%),linear-gradient(180deg,#050816_0%,#0f172a_48%,#f8fafc_48%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/10 bg-slate-950/92 p-6 text-white shadow-[0_30px_90px_rgba(2,6,23,0.34)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Taller oficial</p>
              <p className="mt-3 inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                Landing + Panel del cliente + Cotizador
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl [font-family:var(--font-cormorant)]">
                Reparación Profesional de Electrónicos
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Aquí vive la experiencia 3 en 1 del tenant <span className="text-white">{tenant}</span>. Desde aquí puedes cotizar, revisar el estado de tu equipo y entrar al panel del cliente con el mismo lenguaje de marca.
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:grid-cols-2">
              <Link href={`/${tenant}/tracking`} className="rounded-2xl bg-amber-300 px-5 py-4 font-semibold text-slate-950 transition hover:bg-amber-200">
                Ver estatus de mi equipo
              </Link>
              <Link href={`/${tenant}/cotizar`} className="rounded-2xl border border-white/15 px-5 py-4 font-semibold text-white transition hover:bg-white/10">
                Solicitar cotización
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-3">
          {services.map(([title, copy]) => (
            <article key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">Servicio</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">Estado</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 [font-family:var(--font-cormorant)]">
              Consulta el avance de tu reparación sin llamar ni esperar.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              El panel del cliente vive junto a la landing y conserva el mismo tono de marca que la recepción del taller. Cotizador, tracking y acceso al panel quedan unidos en la misma experiencia.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Qué puedes hacer</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• Ver el estatus actual del equipo.</li>
              <li>• Consultar folio y detalles de la reparación.</li>
              <li>• Enviar una solicitud de cotización al taller.</li>
            </ul>
          </div>
        </section>
      </section>
    </main>
  );
}
