"use client";

import { useState } from 'react';
import Nav from '@/components/Nav';
import { apiClient } from '@/lib/apiClient';

type EntityResponse = {
  id: string;
};

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const seed = async () => {
    setLoading(true);
    setMessage('Creando datos...');
    try {
      // 1. Crear Clientes
      const c1Res = await apiClient.post<EntityResponse>('/api/customers', {
        fullName: 'Juan Pérez (Demo)',
        email: 'juan.demo@example.com',
        phone: '555-0101'
      });

      const c2Res = await apiClient.post<EntityResponse>('/api/customers', {
        fullName: 'María García (Demo)',
        email: 'maria.demo@example.com',
        phone: '555-0102'
      });

      if (!c1Res.success || !c2Res.success) {
        throw new Error('Error al crear clientes de prueba');
      }
      if (!c1Res.data?.id || !c2Res.data?.id) {
        throw new Error('La API no devolvió el id del cliente creado');
      }

      // 2. Crear Órdenes de Servicio
      await apiClient.post('/api/service-orders', {
        customerId: c1Res.data.id,
        deviceType: 'Laptop',
        deviceBrand: 'Dell',
        deviceModel: 'XPS 13',
        reportedIssue: 'No enciende, se mojó con café'
      });

      await apiClient.post('/api/service-orders', {
        customerId: c2Res.data.id,
        deviceType: 'Smartphone',
        deviceBrand: 'Apple',
        deviceModel: 'iPhone 15',
        reportedIssue: 'Pantalla estrellada'
      });

      setMessage('¡Datos creados con éxito! Ya puedes ver los paneles.');
    } catch (e) {
      setMessage('Error: ' + (e instanceof Error ? e.message : 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <Nav />
      <section className="card">
        <h1>Generador de Datos de Prueba</h1>
        <p>Como tu cuenta es nueva, no tienes datos. Pulsa el botón para crear clientes y órdenes de ejemplo.</p>
        <button onClick={seed} disabled={loading}>
          {loading ? 'Sembrando...' : 'Generar Datos de Ejemplo'}
        </button>
        {message && <p>{message}</p>}
      </section>
    </main>
  );
}
