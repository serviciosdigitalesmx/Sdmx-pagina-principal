'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signUpWithEmail } from '@/lib/auth-submit';
import { AuthShell } from '@/components/auth-shell';

export default function SignupPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const { error: authError } = await signUpWithEmail({ fullName, email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.');
    setLoading(false);
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Abre tu prueba gratis por 14 días con acceso completo a las funciones del sistema."
      footer={
        <p className="text-sm text-zinc-300">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-semibold text-emerald-300 underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="signup-name">
            Nombre
          </label>
          <input
            id="signup-name"
            name="fullName"
            type="text"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="Tu nombre"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="signup-email">
            Correo
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="tu@empresa.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="signup-password">
            Contraseña
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthShell>
  );
}
