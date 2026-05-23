"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function buildBridgeUrl(token: string, tenant: string | null) {
  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return { url: null, error: "Falta configurar NEXT_PUBLIC_WEB_ADMIN_URL." };
  }

  let base: URL;

  try {
    base = new URL(adminUrl);
  } catch {
    return { url: null, error: "NEXT_PUBLIC_WEB_ADMIN_URL no es una URL válida." };
  }

  if (base.protocol !== "https:") {
    return { url: null, error: "NEXT_PUBLIC_WEB_ADMIN_URL debe usar https." };
  }

  base.pathname = "/auth/bridge";
  base.search = "";
  base.searchParams.set("token", token);

  if (tenant) {
    base.searchParams.set("tenant", tenant);
  }

  return { url: base.toString(), error: null };
}

export function RedirectToAdmin() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tenant = searchParams.get("tenant");
  const [error, setError] = useState<string | null>(null);

  const targetUrl = useMemo(() => {
    if (!token) {
      return null;
    }

    const result = buildBridgeUrl(token, tenant);

    if (result.error) {
      setError(result.error);
      return null;
    }

    return result.url;
  }, [tenant, token]);

  useEffect(() => {
    if (!token) {
      setError("Falta el token de sesión en el callback de éxito.");
      return;
    }

    if (!targetUrl) {
      return;
    }

    window.location.replace(targetUrl);
  }, [targetUrl, token]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_38%,#ffffff_100%)] px-6 py-12 text-slate-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Registro completado</p>
        <h1 className="text-4xl font-semibold tracking-tight">Tu prueba gratuita ya quedó creada.</h1>
        <p className="text-lg leading-8 text-slate-600">
          {tenant ? `Tenant: ${tenant}.` : "El tenant fue creado correctamente."} La sesión quedó guardada en este navegador.
        </p>
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
            Preparando tu panel administrativo...
          </div>
        )}
      </section>
    </main>
  );
}
