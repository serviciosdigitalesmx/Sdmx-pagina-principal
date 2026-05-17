"use client";

import { useEffect, useState } from "react";
import { saveAuthToken } from "@/lib/auth-storage";

function resolveDashboardUrl() {
  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return null;
  }

  return new URL("/", adminUrl).toString();
}

export default function AuthBridgePage() {
  const [message, setMessage] = useState("Sincronizando sesión...");

  useEffect(() => {
    const token = new URL(window.location.href).searchParams.get("token");

    if (!token) {
      setMessage("No llegó el token de sesión.");
      return;
    }

    saveAuthToken(token);

    const dashboardUrl = resolveDashboardUrl();

    if (!dashboardUrl) {
      setMessage("Falta configurar NEXT_PUBLIC_WEB_ADMIN_URL.");
      return;
    }

    window.location.replace(dashboardUrl);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Sesión autenticada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">{message}</p>
      </div>
    </main>
  );
}
