"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";
import { optionalEnv } from "@white-label/config";

const hubName = optionalEnv("NEXT_PUBLIC_HUB_NAME") ?? "Hub";
const adminUrl = optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ?? "";
const publicHomeLabel = optionalEnv("NEXT_PUBLIC_SAAS_BRAND_NAME") ?? "Servicios Digitales MX";

function resolveAdminBridgeUrl(token: string) {
  if (!adminUrl) {
    return null;
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);
  return bridgeUrl.toString();
}

export default function HubPage() {
  const [tokenState] = useState(() => {
    if (typeof window === "undefined") {
      return "missing" as const;
    }

    const url = new URL(window.location.href);
    return (url.searchParams.get("token") || readAuthToken()) ? ("present" as const) : ("missing" as const);
  });

  const targetLabel = useMemo(() => {
    return adminUrl ? "Ir al panel administrativo" : `Volver a ${publicHomeLabel}`;
  }, []);

  useEffect(() => {
    const tokenFromUrl = typeof window === "undefined" ? null : new URL(window.location.href).searchParams.get("token");
    if (tokenFromUrl) {
      saveAuthToken(tokenFromUrl);
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    const token = tokenFromUrl || readAuthToken();
    if (!token) {
      return;
    }

    const bridgeUrl = resolveAdminBridgeUrl(token);
    if (bridgeUrl) {
      window.location.replace(bridgeUrl);
      return;
    }

    window.location.replace("/dashboard");
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.14),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(94,157,201,0.08),_transparent_24%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_52%,#ffffff_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 rounded-[2.5rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Acceso al hub</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">{hubName}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Un solo centro de mando para sincronizar sesión y abrir la ruta correcta sin perder el contexto.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1f2937]">Estado</p>
            <p className="mt-2 text-lg font-medium text-slate-950">
              {tokenState === "present"
                ? "Redirigiendo al panel administrativo..."
                : "No encontramos una sesión guardada. Vuelve a iniciar sesión."}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {tokenState === "present"
                ? "La sesión existe y puede transferirse al panel."
                : "Sin sesión guardada todavía. Debes entrar por login u onboarding."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {adminUrl ? (
            <a
              href={resolveAdminBridgeUrl(readAuthToken() || "") ?? adminUrl}
              className="rounded-full bg-[#334155] px-5 py-3 font-semibold text-white transition hover:bg-[#1f2937]"
            >
              {targetLabel}
            </a>
          ) : null}
          <Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
