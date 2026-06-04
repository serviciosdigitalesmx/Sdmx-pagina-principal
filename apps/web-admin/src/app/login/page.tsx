"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { loginWithSupabase } from '@/lib/auth';
import { setActiveSucursalId } from '@/lib/tenant';

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSupabaseLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Entorno de autenticacion incompleto.');
      }

      const supabase = getBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw signInError;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error('No se obtuvo access token de Supabase.');
      }

      const { user } = await loginWithSupabase(accessToken);
      setActiveSucursalId(user.sucursalId || null);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-srf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-srf-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-orbitron font-bold text-white">SF</span>
          </div>
          <h1 className="text-4xl font-orbitron font-bold text-srf-primary">SrFix</h1>
          <p className="text-srf-muted mt-2">Panel de administracion</p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesion</h2>

          <form onSubmit={handleSupabaseLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input w-full"
                placeholder="dueno@taller.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contrasena</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input w-full"
                placeholder="Tu contrasena"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-srf-bg flex items-center justify-center"><div className="spinner w-8 h-8" /></div>}>
      <LoginScreen />
    </Suspense>
  );
}
