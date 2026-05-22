"use client";

import { useEffect } from "react";
import { saveAuthToken } from "@/lib/auth-storage";

function resolveNextUrl() {
  return new URL("/dashboard", window.location.origin).toString();
}

export default function AuthBridgePage() {
  const token = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("token");
  const nextUrl = typeof window === "undefined" ? null : resolveNextUrl();

  useEffect(() => {
    if (!token) {
      return;
    }

    saveAuthToken(token);

    if (nextUrl) {
      window.location.replace(nextUrl);
    }
  }, [nextUrl, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Sesión autenticada</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {token ? "La sesión quedó guardada. Redirigiendo al panel..." : "No llegó el token de sesión."}
        </p>
      </div>
    </main>
  );
}
