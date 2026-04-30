'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { persistSession, clearSession, type Session } from '@/lib/session';

const parseHash = (hash: string): URLSearchParams => {
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(cleaned);
};

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const run = () => {
      const { hash } = window.location;
      const params = parseHash(hash);

      const error = params.get('error_description') || params.get('error');
      if (error) {
        clearSession();
        setMessage(error);
        return;
      }

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const expiresAt = params.get('expires_at');
      const tokenType = params.get('token_type') || 'bearer';

      if (!accessToken) {
        clearSession();
        setMessage('No se recibió access_token en el callback OAuth.');
        return;
      }

      const now = Date.now();
      const expiresAtIso = expiresAt && Number.isFinite(Number(expiresAt))
        ? new Date(Number(expiresAt) * 1000).toISOString()
        : expiresIn && Number.isFinite(Number(expiresIn))
          ? new Date(now + Number(expiresIn) * 1000).toISOString()
          : new Date(now + 3600 * 1000).toISOString();

      const tokenOnlySession = {
        accessToken,
        refreshToken: refreshToken || '',
        expiresAt: expiresAtIso,
        tokenType
      } as unknown as Session;

      persistSession(tokenOnlySession);

      apiClient.get<Session>('/api/auth/me')
        .then((response) => {
          if (response.success && response.data) {
            persistSession({
              ...tokenOnlySession,
              ...response.data
            });
          }
        })
        .catch(() => {
          // Keep the token-only session so the dashboard can retry auth state resolution.
        })
        .finally(() => {
          window.history.replaceState({}, document.title, '/dashboard');
          router.replace('/dashboard');
        });
    };

    run();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#05080F] p-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-white">
        {message}
      </div>
    </main>
  );
}
