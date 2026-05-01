'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/session';
import { getSupabaseClient } from '@/lib/supabase';

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
          clearSession();
          setMessage(error);
          return;
        }

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          clearSession();
          setMessage('No se recibió access_token en el callback OAuth.');
          return;
        }

        const supabase = getSupabaseClient();
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        });
        if (sessionError) throw sessionError;

        window.history.replaceState({}, document.title, '/hub');
        router.replace('/hub');
      } catch (error) {
        clearSession();
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
