"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readAuthToken } from "@/lib/auth-storage";
import { getCurrentSession } from "@/lib/session";
import { OperationalHub } from "@/components/dashboard/operational-hub";

function SessionPending() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,#08111f_0%,#091428_100%)] px-6 text-zinc-100">
      <div className="max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/85 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Sesión</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Esperando a que el token de sesión quede disponible en este navegador.
        </p>
      </div>
    </main>
  );
}

export function SessionGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const redirected = useRef(false);

  useEffect(() => {
    const readSession = () => {
      const token = readAuthToken();
      // If no token but a development token is provided via env, use it as a fallback for local testing
      const devToken = typeof window !== 'undefined' ? (window.__NEXT_DATA__?.props?.pageProps?.env?.NEXT_PUBLIC_DEV_AUTH_TOKEN ?? (process.env?.NEXT_PUBLIC_DEV_AUTH_TOKEN ?? null)) : null;
      if (!token && devToken) {
        try {
          // write directly to localStorage for session gate detection
          window.localStorage.setItem(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? 'app_auth_token', String(devToken));
        } catch {}
      }

      const finalToken = readAuthToken();
      const currentSession = getCurrentSession();
      setReady(Boolean(finalToken) && Boolean(currentSession));

      if ((!token || !currentSession) && !redirected.current) {
        redirected.current = true;
        if (token && !currentSession) {
          try {
            window.localStorage.removeItem(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "app_auth_token");
            window.sessionStorage.removeItem(process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "app_auth_token");
          } catch {}
        }
        router.replace("/login");
      }
    };

    readSession();

    const interval = window.setInterval(readSession, 250);
    const onStorage = () => readSession();

    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [router]);

  if (!ready) {
    return <SessionPending />;
  }

  return <OperationalHub />;
}
