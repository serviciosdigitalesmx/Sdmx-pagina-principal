import Link from "next/link";

function resolveDashboardTarget() {
  const dashboardBaseUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!dashboardBaseUrl) {
    return null;
  }

  return new URL("/", dashboardBaseUrl).toString();
}

export default function DashboardBridgePage() {
  const dashboardTarget = resolveDashboardTarget();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Sesión iniciada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ya entraste al sistema</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          El login quedó guardado. Si el panel administrativo está disponible, entra desde aquí para evitar una redirección rota.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {dashboardTarget ? (
            <a
              href={dashboardTarget}
              className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Ir al panel
            </a>
          ) : null}
          <Link
            href="/"
            className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
