"use client";

import Link from "next/link";
import { useEffect } from "react";
import { resolveAdminUrl } from "@/lib/admin-url";

function resolveDashboardTarget() {
  const adminUrl = resolveAdminUrl();
  return adminUrl ? new URL("/", adminUrl).toString() : null;
}

export default function DashboardBridgePage() {
  const dashboardTarget = resolveDashboardTarget();

  useEffect(() => {
    if (dashboardTarget) {
      window.location.replace(dashboardTarget);
    }
  }, [dashboardTarget]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Sesión iniciada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ya entraste al sistema</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {dashboardTarget
            ? "La sesión quedó guardada. Redirigiendo al panel..."
            : "Falta configurar la URL del panel para continuar."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {dashboardTarget ? (
            <a
              href={dashboardTarget}
              className="rounded-full bg-[#334155] px-5 py-3 font-semibold text-white transition hover:bg-[#1f2937]"
            >
              Ir al panel
            </a>
          ) : null}
          <Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
