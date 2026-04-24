'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, getAccessToken, isSessionExpired, readSession } from '@/lib/session';

export default function ProtectedData({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const session = readSession();
      const token = getAccessToken();

      if (!session || isSessionExpired(session) || !token) {
        clearSession();
        router.push('/login');
        return;
      }

      try {
        const payload = await api<unknown>(endpoint, {}, token);
        setData(payload);
      } catch (e) {
        clearSession();
        setError(e instanceof Error ? e.message : 'Error de carga');
        router.push('/login');
      }
    };

    void run();
  }, [endpoint, router]);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Cargando...</p>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
