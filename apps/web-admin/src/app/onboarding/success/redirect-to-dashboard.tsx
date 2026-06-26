"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { saveAuthToken } from "@/lib/auth-storage";
import { resolveAdminApiBaseUrl } from "@/lib/api-base-url";
import { clearBillingExpiredState } from "@/lib/billing-expired";
import {
  extractTenantRuntimeConfig,
  saveTenantRuntimeConfig,
} from "@/lib/tenant-runtime-config";

export function OnboardingSuccessRedirect() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tenant = searchParams.get("tenant");

  const message = useMemo(() => {
    if (!token) {
      return "No llegó la sesión de alta.";
    }

    return tenant ? `Alta completada para ${tenant}.` : "Alta completada.";
  }, [tenant, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    const sessionToken = token;
    const tenantSlug = tenant;

    async function prepareDashboardSession() {
      saveAuthToken(sessionToken);
      clearBillingExpiredState();

      if (tenantSlug) {
        try {
          const apiUrl = resolveAdminApiBaseUrl();
          const response = await fetch(`${apiUrl}/api/auth/tenant/${encodeURIComponent(tenantSlug)}/settings`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${sessionToken}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const settings = await response.json().catch(() => null);
            if (settings) {
              saveTenantRuntimeConfig(extractTenantRuntimeConfig(settings));
            }
          }
        } catch {
          // Onboarding must still reach the dashboard; route guards have safe defaults.
        }
      }

      if (!cancelled) {
        window.location.replace("/dashboard");
      }
    }

    prepareDashboardSession();

    return () => {
      cancelled = true;
    };
  }, [tenant, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Registro completado</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{message}</p>
        {!token ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-left text-xs leading-5 text-slate-600">
            La sesión no llegó en el callback de alta.
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-left text-xs leading-5 text-slate-600">
            <p className="font-semibold text-slate-800">Token recibido</p>
            <p className="mt-1 break-all">Guardado y listo para ir al dashboard.</p>
          </div>
        )}
      </div>
    </main>
  );
}
