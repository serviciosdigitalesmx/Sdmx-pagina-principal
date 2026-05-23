"use client";

import { useEffect, useState } from "react";
import { readAuthToken } from "@/lib/auth-storage";
import { OperationalHub } from "@/components/dashboard/operational-hub";

function SessionPending() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_28%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_100%)] px-6 text-slate-950">
      <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Sesión</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Esperando a que el token de sesión quede disponible en este navegador.
        </p>
      </div>
    </main>
  );
}

export function SessionGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const readSession = () => {
      setReady(Boolean(readAuthToken()));
    };

    readSession();

    const interval = window.setInterval(readSession, 250);
    const onStorage = () => readSession();

    window.addEventListener("storage", onStorage);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!ready) {
    return <SessionPending />;
  }

  return <OperationalHub />;
}
