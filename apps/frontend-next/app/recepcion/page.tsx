'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Nav from '@/components/Nav';
import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

type Order = { id: string; folio?: string; status: string; device_brand?: string; device_model?: string };

export default function Page() {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState('diagnostico');
  const queryClient = useQueryClient();

  const token = useMemo(() => getAccessToken(), []);

  const orders = useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => api<Order[]>('/api/service-orders', {}, token ?? undefined),
    enabled: Boolean(token)
  });

  const updateStatus = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Sesión inválida');
      return api(`/api/service-orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      setOrderId('');
    }
  });

  return (
    <main>
      <Nav />
      <section className="card">
        <h2>Recepción / Service Orders</h2>
        {orders.isLoading ? <p>Cargando órdenes...</p> : <pre>{JSON.stringify(orders.data, null, 2)}</pre>}
      </section>

      <section className="card">
        <h3>Actualizar estado</h3>
        <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ID de orden" />
        <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Nuevo estado" />
        <button onClick={() => updateStatus.mutate()} disabled={!orderId || updateStatus.isPending}>Actualizar</button>
        {updateStatus.error ? <p>{(updateStatus.error as Error).message}</p> : null}
      </section>
    </main>
  );
}
