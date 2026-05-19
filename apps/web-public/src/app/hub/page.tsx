"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";

const hubName = process.env.NEXT_PUBLIC_HUB_NAME ?? "Hub operativo";
const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;
const publicHomeLabel = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "Plataforma SaaS";
const tenantLandingTemplate = process.env.NEXT_PUBLIC_TENANT_LANDING_URL_TEMPLATE ?? "/{tenant}";

type JwtPayload = {
  tenant_slug?: string;
  tenant_id?: string;
};

function resolveAdminBridgeUrl(token: string) {
  if (!adminUrl) {
    return null;
  }

  const bridgeUrl = new URL("/auth/bridge", adminUrl);
  bridgeUrl.searchParams.set("token", token);
  return bridgeUrl.toString();
}

function resolveTenantLandingUrl(tenantSlug: string) {
  return tenantLandingTemplate.includes("{tenant}")
    ? tenantLandingTemplate.replaceAll("{tenant}", tenantSlug)
    : `${tenantLandingTemplate.replace(/\/$/, "")}/${tenantSlug}`;
}

function decodeTokenPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export default function HubPage() {
  const [status, setStatus] = useState("Sincronizando sesión...");
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  const targetLabel = useMemo(() => {
    return adminUrl ? "Ir al panel administrativo" : `Volver a ${publicHomeLabel}`;
  }, []);

  const tenantLandingUrl = useMemo(() => {
    if (!tenantSlug) {
      return null;
    }

    return resolveTenantLandingUrl(tenantSlug);
  }, [tenantSlug]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");
    const tenantFromUrl = url.searchParams.get("tenant");

    if (tokenFromUrl) {
      saveAuthToken(tokenFromUrl);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    }

    if (tenantFromUrl) {
      setTenantSlug(tenantFromUrl);
    }

    const token = tokenFromUrl || readAuthToken();

    if (!token) {
      setStatus("No encontramos una sesión guardada. Vuelve a iniciar sesión.");
      return;
    }

    const payload = decodeTokenPayload(token);
    const tenantFromToken = payload?.tenant_slug ?? payload?.tenant_id ?? null;
    if (tenantFromToken) {
      setTenantSlug(tenantFromUrl || tenantFromToken);
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
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Acceso al hub</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{hubName}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Este punto sincroniza la sesión antes de entrar al hub interno. Ya no es un cascarón visual.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Estado</p>
          <p className="mt-2 text-lg font-medium text-white">{status}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Si la sesión existe, el token se unifica en este dominio y se transfiere al admin bridge.
          </p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Landing del tenant</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Este hub debe conocer la URL base de la landing por tenant desde configuración, no desde hardcode.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-200">
            <p className="text-slate-400">Template</p>
            <p className="mt-1 font-mono text-xs break-all text-white">{tenantLandingTemplate}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-200">
            <p className="text-slate-400">URL resuelta</p>
            <p className="mt-1 font-mono text-xs break-all text-white">
              {tenantSlug ? tenantLandingUrl : "Abre el hub con ?tenant=slug para resolver la URL del tenant"}
            </p>
          </div>
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
          {tenantLandingUrl ? (
            <a
              href={tenantLandingUrl}
              className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Abrir landing del tenant
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
