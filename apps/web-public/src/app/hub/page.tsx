"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";

const hubName = process.env.NEXT_PUBLIC_HUB_NAME ?? "Hub operativo";
const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;
const publicHomeLabel = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "Plataforma SaaS";

function resolveAdminBridgeUrl(token: string) {
  if (!adminUrl) {
    return null;
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);
  return bridgeUrl.toString();
}

export default function HubPage() {
  const [status, setStatus] = useState("Sincronizando sesión...");

  const targetLabel = useMemo(() => {
    return adminUrl ? "Ir al panel administrativo" : `Volver a ${publicHomeLabel}`;
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");

    if (tokenFromUrl) {
      saveAuthToken(tokenFromUrl);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    const token = tokenFromUrl || readAuthToken();

    if (!token) {
      setStatus("No encontramos una sesión guardada. Vuelve a iniciar sesión.");
      return;
    }

    const bridgeUrl = resolveAdminBridgeUrl(token);

    if (!bridgeUrl) {
      setStatus("Falta configurar NEXT_PUBLIC_WEB_ADMIN_URL.");
      return;
    }

    setStatus("Redirigiendo al panel administrativo...");
    window.location.replace(bridgeUrl);
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#f8fafc_48%,#f8fafc_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-4xl gap-8 rounded-[2.5rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/30">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Acceso central</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{hubName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Este punto sincroniza la sesión antes de entrar al panel. Ya no es un cascarón visual.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Estado</p>
          <p className="mt-2 text-lg font-medium text-white">{status}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Si la sesión existe, el token se unifica en este dominio y se transfiere al admin bridge.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full border border-cyan-300 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-white/10"
          >
            Volver a {publicHomeLabel}
          </Link>
          {adminUrl ? (
            <a
              href={resolveAdminBridgeUrl(readAuthToken() || "") ?? adminUrl}
              className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {targetLabel}
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
