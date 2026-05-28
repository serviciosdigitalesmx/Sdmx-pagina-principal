"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";
import { requireEnv, resolveApiBaseUrl } from "@white-label/config";

const hubName = requireEnv("NEXT_PUBLIC_HUB_NAME");
const adminUrl = requireEnv("NEXT_PUBLIC_WEB_ADMIN_URL");
const publicHomeLabel = requireEnv("NEXT_PUBLIC_SAAS_BRAND_NAME");
const tenantLandingTemplate = requireEnv("NEXT_PUBLIC_TENANT_LANDING_URL_TEMPLATE");
const hubModules = [
  {
    title: "Recepción",
    description: "Alta de orden, cliente, diagnóstico y seguimiento.",
    badge: "Entrada",
  },
  {
    title: "Clientes",
    description: "Historial, duplicados y contexto de servicio.",
    badge: "Relación",
  },
  {
    title: "Stock",
    description: "Inventario, alertas y reabastecimiento.",
    badge: "Control",
  },
  {
    title: "Finanzas",
    description: "Cobros, egresos y lectura de utilidad.",
    badge: "Números",
  },
  {
    title: "Reportes",
    description: "Visión diaria, semanal y mensual del tenant.",
    badge: "KPI",
  },
  {
    title: "Seguridad",
    description: "Roles, candados y bitácora para acciones críticas.",
    badge: "Acceso",
  },
];

function resolveAdminBridgeUrl(token: string) {
  if (!adminUrl) {
    return null;
  }

  if (typeof window !== "undefined") {
    try {
      if (new URL(adminUrl).origin === window.location.origin) {
        return null;
      }
    } catch {
      return null;
    }
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

function readTenantSlugFromToken(token: string) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));

    if (typeof decoded?.tenant_slug === "string" && decoded.tenant_slug.trim().length > 0) {
      return decoded.tenant_slug.trim();
    }

    return null;
  } catch {
    return null;
  }
}

async function resolveTenantSlugFromApi(token: string) {
  const apiUrl = resolveApiBaseUrl();

  const response = await fetch(`${apiUrl}/api/auth/session`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { user?: { tenantSlug?: string } };
  const tenantSlug = payload.user?.tenantSlug?.trim();

  return tenantSlug ? tenantSlug : null;
}

export default function HubPage() {
  const [sessionState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        status: "Sincronizando sesión...",
        tenantSlug: null as string | null,
        tokenState: "missing" as const,
      };
    }

    const url = new URL(window.location.href);
    return {
      status: "Sincronizando sesión...",
      tenantSlug: url.searchParams.get("tenant"),
      tokenState: (url.searchParams.get("token") || readAuthToken()) ? ("present" as const) : ("missing" as const),
    };
  });

  const targetLabel = useMemo(() => {
    return adminUrl ? "Ir al panel administrativo" : `Volver a ${publicHomeLabel}`;
  }, []);

  const tenantLandingUrl = useMemo(() => {
    if (!sessionState.tenantSlug) {
      return null;
    }

    return resolveTenantLandingUrl(sessionState.tenantSlug);
  }, [sessionState.tenantSlug]);

  useEffect(() => {
    const run = async () => {
      const url = new URL(window.location.href);
      const tokenFromUrl = url.searchParams.get("token");

      if (tokenFromUrl) {
        saveAuthToken(tokenFromUrl);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      }

      const token = tokenFromUrl || readAuthToken();

      if (!token) {
        return;
      }

      const tenantSlugFromToken = readTenantSlugFromToken(token);

      if (tenantSlugFromToken) {
        const tenantUrl = resolveTenantLandingUrl(tenantSlugFromToken);
        window.location.replace(tenantUrl);
        return;
      }

      const tenantSlugFromApi = await resolveTenantSlugFromApi(token);

      if (tenantSlugFromApi) {
        const tenantUrl = resolveTenantLandingUrl(tenantSlugFromApi);
        window.location.replace(tenantUrl);
        return;
      }

      const bridgeUrl = resolveAdminBridgeUrl(token);

      if (!bridgeUrl) {
        return;
      }

      window.location.replace(bridgeUrl);
    };

    void run();
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.14),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(94,157,201,0.08),_transparent_24%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_52%,#ffffff_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-6xl gap-8 rounded-[2.5rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Acceso al hub</p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">{hubName}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Un solo centro de mando para sincronizar sesión, entrar al taller y abrir la ruta correcta sin perder el contexto.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1f2937]">Estado</p>
            <p className="mt-2 text-lg font-medium text-slate-950">
              {sessionState.tokenState === "present"
                ? "Redirigiendo al panel administrativo..."
                : "No encontramos una sesión guardada. Vuelve a iniciar sesión."}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {sessionState.tokenState === "present"
                ? "La sesión existe y puede transferirse al panel."
                : "Sin sesión guardada todavía. Debes entrar por login u onboarding."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {hubModules.map((module) => (
            <article key={module.title} className="rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#334155]/30">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[#1f2937]">{module.badge}</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{module.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-slate-500">Landing del tenant</p>
              <p className="mt-1 font-mono text-xs break-all text-slate-950">{tenantLandingTemplate}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="text-slate-500">URL resuelta</p>
              <p className="mt-1 font-mono text-xs break-all text-slate-950">
                {sessionState.tenantSlug ? tenantLandingUrl : "Abre el hub con ?tenant=slug para resolver la URL del tenant"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100"
            >
              Volver a {publicHomeLabel}
            </Link>
            {adminUrl ? (
              <a
                href={resolveAdminBridgeUrl(readAuthToken() || "") ?? adminUrl}
                className="rounded-full bg-[#334155] px-5 py-3 font-semibold text-white transition hover:bg-[#1f2937]"
              >
                {targetLabel}
              </a>
            ) : null}
            {tenantLandingUrl ? (
              <a
                href={tenantLandingUrl}
                className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-100"
              >
                Abrir landing del tenant
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
