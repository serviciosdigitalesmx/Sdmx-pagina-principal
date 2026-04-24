'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearSession, isValidSession, persistSession } from '@/lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const session = await api<unknown>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (!isValidSession(session)) {
        throw new Error('La sesión recibida es inválida o incompleta.');
      }

      persistSession(session);
      router.push('/dashboard');
    } catch (e) {
      clearSession();
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    }
  };

  return (
    <main>
      <section className="card">
        <h1>Login</h1>
        <form onSubmit={onSubmit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" type="email" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" required />
          <button type="submit">Entrar</button>
        </form>
        {error && <p>{error}</p>}
      </section>
    </main>
  );
}
