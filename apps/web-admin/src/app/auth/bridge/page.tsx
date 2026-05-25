"use client";

import Link from "next/link";
import { useEffect } from "react";
import { saveAuthToken } from "@/lib/auth-storage";

function resolveDashboardUrl() {
  return "/dashboard";
}

export default function AuthBridgePage() {
  const token = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("token");
  const dashboardUrl = resolveDashboardUrl();
  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;
  const isCanonicalAdminUrl = (() => {
    if (!adminUrl || typeof window === "undefined") {
      return false;
    }

    try {
      const normalized = new URL(adminUrl);
      return normalized.protocol === "https:" && normalized.origin === window.location.origin;
    } catch {
      return false;
    }
  })();
  const message = !token
    ? "No llegó la sesión."
    : !adminUrl
      ? "Falta configurar la URL del panel."
      : !isCanonicalAdminUrl
        ? "La URL del panel no coincide con la configuración."
        : "Sesión sincronizada. Redirigiendo al panel...";

  useEffect(() => {
    if (!token || !dashboardUrl || !isCanonicalAdminUrl) {
      return;
    }

    saveAuthToken(token);

    window.location.replace(dashboardUrl);
  }, [dashboardUrl, isCanonicalAdminUrl, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Sesión autenticada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{message}</p>
        {!adminUrl || !isCanonicalAdminUrl ? (
          <div className="mt-6 text-left text-sm text-rose-700">
            <p className="font-semibold">Bloqueado por configuración de origen</p>
            <p className="mt-2 leading-6">El acceso no puede continuar hasta que la URL del panel esté bien configurada.</p>
          </div>
        ) : null}
        {token ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-left text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">Token recibido</p>
            <p className="mt-1 break-all">Guardado y listo para ir al panel.</p>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="rounded-full bg-[#2c6e9f] px-5 py-3 font-semibold text-white transition hover:bg-[#245a82]">
            Ir al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
