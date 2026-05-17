'use client';

import Link from 'next/link';
import { useState } from 'react';
import { signInWithEmail } from '@/lib/auth-submit';
import { AuthShell } from '@/components/auth-shell';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    const { error: authError } = await signInWithEmail({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = '/';
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Entra a tu cuenta para administrar tu taller, revisar operaciones y continuar donde lo dejaste."
      footer={
        <div className="space-y-3 text-sm text-zinc-300">
          <p>
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="font-semibold text-emerald-300 underline underline-offset-4">
              Regístrate
            </Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña?{' '}
            <Link
              href="/forgot-password"
              className="font-semibold text-emerald-300 underline underline-offset-4"
            >
              Recuperarla
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="login-email">
            Correo
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="tu@empresa.com"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="login-password">
            Contraseña
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="••••••••"
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthShell>
  );
}
