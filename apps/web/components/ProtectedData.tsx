"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import type { ApiResponse } from '@sdmx/contracts';

export default function ProtectedData({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const response = await apiClient.get<unknown>(endpoint) as ApiResponse<unknown>;
        
        if (!response.success) {
          const errorCode = typeof response.error === 'object' && response.error && 'code' in response.error
            ? (response.error as { code?: unknown }).code
            : undefined;
          if (errorCode === 'UNAUTHORIZED') {
            router.push('/login');
            return;
          }
          throw new Error(getApiErrorMessage(response.error, 'Error de carga'));
        }

        setData(response.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error de carga');
      }
    };

    void run();
  }, [endpoint, router]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Cargando...</p>;
  return <pre className="data-dump">{JSON.stringify(data, null, 2)}</pre>;
}
