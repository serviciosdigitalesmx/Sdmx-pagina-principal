import Link from "next/link";

const hubName = process.env.NEXT_PUBLIC_HUB_NAME ?? "Hub operativo";
const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;
const publicHomeLabel = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "Plataforma SaaS";

export default function HubPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#f8fafc_48%,#f8fafc_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Acceso central</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {hubName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Desde aquí entras al panel administrativo del taller o vuelves al sitio público. Esta página existe para que el login siempre llegue a un destino real.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {adminUrl ? (
              <a
                href={adminUrl}
                className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Abrir panel
              </a>
            ) : null}
            <Link
              href="/"
              className="rounded-full border border-cyan-300 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-white/10"
            >
              Volver a {publicHomeLabel}
            </Link>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Panel</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {adminUrl ? "Panel administrativo conectado" : "Configurar NEXT_PUBLIC_WEB_ADMIN_URL"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Si el panel está publicado en otro dominio, este botón te lleva ahí sin pasar por una ruta rota.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">Sitio público</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">Portada, onboarding y acceso</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta capa no debería recibir el 404 después del login. El hub actúa como punto de entrada estable.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
