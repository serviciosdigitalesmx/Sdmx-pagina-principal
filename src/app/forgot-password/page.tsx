'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendPasswordResetEmail } from '@/lib/auth-submit';
import { AuthShell } from '@/components/auth-shell';

export default function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    const { error: resetError } = await sendPasswordResetEmail(email);
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setMessage('Si el correo existe, te enviamos un enlace de recuperación.');
    setLoading(false);
  }

  return (
    <AuthShell
      title="Recupera tu acceso"
      subtitle="Te ayudamos a restablecer tu contraseña para volver a entrar a tu cuenta."
      footer={
        <p className="text-sm text-zinc-300">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="font-semibold text-emerald-300 underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm text-zinc-300" htmlFor="recover-email">
            Correo
          </label>
          <input
            id="recover-email"
            name="email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
            placeholder="tu@empresa.com"
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>
    </AuthShell>
  );
}
