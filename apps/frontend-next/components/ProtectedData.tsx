'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { clearSession, getAccessToken, isSessionExpired, readSession } from '@/lib/session';

type ProtectedDataProps = {
  endpoint: string;
  queryKey?: readonly unknown[];
};

export default function ProtectedData({ endpoint, queryKey }: ProtectedDataProps) {
  const router = useRouter();

  useEffect(() => {
    const session = readSession();
    const token = getAccessToken();

    if (!session || isSessionExpired(session) || !token) {
      clearSession();
      router.push('/login');
    }
  }, [router]);

  const { data, error, isLoading } = useQuery({
    queryKey: queryKey ?? ['protected', endpoint],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        clearSession();
        router.push('/login');
        throw new Error('Sesión inválida');
      }
      return api<unknown>(endpoint, {}, token);
    }
  });

  if (isLoading) return <p>Cargando...</p>;
  if (error) {
    clearSession();
    router.push('/login');
    return <p>{error instanceof Error ? error.message : 'Error de carga'}</p>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
