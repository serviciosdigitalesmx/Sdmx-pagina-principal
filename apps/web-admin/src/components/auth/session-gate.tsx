"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readAuthToken } from "@/lib/auth-storage";
import { OperationalHub } from "@/components/dashboard/operational-hub";

function SessionPending() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,#08111f_0%,#091428_100%)] px-6 text-zinc-100">
      <div className="max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/85 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <p className="text-xs uppercase tracking-[0.35em] text-violet-300">Sesión</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Preparando el panel</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Esperando a que el token de sesión quede disponible en este navegador.
        </p>
      </div>
    </main>
  );
}

function SessionInvalid() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,#08111f_0%,#091428_100%)] px-6 text-zinc-100">
      <div className="max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950/85 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.26)]">
        <p className="text-xs uppercase tracking-[0.35em] text-violet-300">Sesión inválida</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">No encontramos una sesión activa</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Vuelve a iniciar sesión o crea un tenant nuevo para continuar.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/login" className="rounded-full bg-violet-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-violet-300">
            Ir al login
          </Link>
          <Link href="/onboarding" className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-white/5">
            Crear tenant
          </Link>
        </div>
      </div>
    </main>
  );
}

export function SessionGate() {
  const [ready, setReady] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const readSession = () => {
      const token = readAuthToken();
      setReady(Boolean(token));
      setInvalid(!token);
      setResolved(true);
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

  if (resolved && invalid && !ready) {
    return <SessionInvalid />;
  }

  if (!ready) {
    return <SessionPending />;
  }

  return <OperationalHub />;
}
