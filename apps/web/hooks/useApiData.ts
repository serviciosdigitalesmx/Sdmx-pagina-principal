"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

/**
 * Hook genérico para manejar la carga de datos desde el API.
 * Ideal para tablas y listas que requieren estado de carga y refresco.
 */
export function useApiData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<T>(endpoint);
      if (result.success) {
        setData(result.data ?? null);
      } else {
        setError(getApiErrorMessage(result.error, 'Error al cargar los datos'));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de red');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    setData,
    refresh: fetchData 
  };
}
