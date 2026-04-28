'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const tenantId = shopName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';
      const response = await apiClient.post('/api/auth/register', {
        email,
        password,
        fullName,
        tenantId
      });

      if (!response.success) {
        throw new Error(response.error?.message || 'Error al registrar');
      }

      alert('Usuario creado con éxito. Ahora puedes iniciar sesión.');
      router.push('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <section className="card">
        <h1>Registro de Usuario</h1>
        <form onSubmit={onSubmit}>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" required />
          <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Nombre de tu negocio" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" type="email" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" required />
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Registrar'}</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <p><a href="/login">Volver al login</a></p>
      </section>
    </main>
  );
}
