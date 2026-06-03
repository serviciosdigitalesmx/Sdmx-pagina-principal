"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readAuthToken } from "@/lib/auth-storage";
import { OperationalHub } from "@/components/dashboard/operational-hub";
import { EmptyState } from "@white-label/ui";

function SessionPending() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        title="Preparando el panel"
        description="Esperando a que el token de sesión quede disponible en este navegador."
        className="w-full max-w-lg"
      />
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

      setReady(Boolean(token));

      if (!token && !redirected.current) {
        redirected.current = true;
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
