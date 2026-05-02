"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buildApiUrl } from "@/lib/api-base";
import { setToken } from "@/lib/auth/tokenManager";
import type { ApiResponse } from "@sdmx/contracts";
import type { Session } from "@/lib/session";

const parseHash = (hash: string): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const run = async () => {
      try {
        const params = parseHash(window.location.hash);
        const error = params.get('error_description') || params.get('error');
        if (error) {
          setMessage(error);
          return;
        }

        const accessToken = params.get('access_token');
        if (!accessToken) {
          setMessage('No se recibió access_token en el callback OAuth.');
          return;
        }

        const bootstrapResponse = await fetch(buildApiUrl('/auth/oauth/bootstrap'), {
          method: 'POST',
          credentials: 'include',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json'
          }
        });
        const bootstrapPayload = await bootstrapResponse.json().catch(() => null) as ApiResponse<Session> | null;
        if (!bootstrapResponse.ok || !bootstrapPayload?.success || !bootstrapPayload.data) {
          throw new Error(bootstrapPayload?.error?.message || 'No se pudo completar el bootstrap de OAuth');
        }

        setToken(bootstrapPayload.data.accessToken || accessToken);
        window.history.replaceState({}, document.title, '/hub');
        router.replace('/hub');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'No se pudo completar la autenticación.');
      }
    };

    void run();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05080F] p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white">
        {message}
      </div>
    </main>
  );
}
