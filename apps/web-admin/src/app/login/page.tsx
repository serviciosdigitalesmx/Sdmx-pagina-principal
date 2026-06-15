"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';
import { loginWithSupabase } from '@/lib/auth';
import { setActiveSucursalId } from '@/lib/tenant';
import { platformBrand } from '@/config/branding';

function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      setActiveSucursalId(user.sucursalId || null, { skipReload: true });
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const getGoogleOnboardingUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const url = new URL(apiUrl.replace(/\/$/, '') + "/api/auth/google");
    url.searchParams.set("origin", window.location.origin);
    return url.toString();
  };

  const handleGoogleRegister = () => {
    const url = getGoogleOnboardingUrl();
    if (!url) {
      setError("Falta configurar la URL del API.");
      return;
    }
    window.location.assign(url);
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!email.trim()) {
        throw new Error("Escribe tu correo primero");
      }

      const supabase = getBrowserSupabaseClient();
      const redirectTo = new URL("/login/reset-password", window.location.origin).toString();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess("Te enviamos un correo para recuperar la contraseña.");
    } catch (resetErr) {
      const message = resetErr instanceof Error ? resetErr.message : "Error inesperado";
      setError(message);
    } finally {
      setResetLoading(false);
    }
  };

  const publicUrl = process.env.NEXT_PUBLIC_WEB_PUBLIC_URL || '';

  return (
    <div className="min-h-screen bg-srf-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-srf-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-orbitron font-bold text-white">SF</span>
          </div>
          <h1 className="text-4xl font-orbitron font-bold text-srf-primary">{platformBrand}</h1>
          <p className="text-srf-muted mt-2">Panel de administración</p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar sesión</h2>

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
                placeholder="Tu contraseña"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            ) : null}
            <button type="submit" className="btn-primary w-full" disabled={loading || resetLoading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-srf-border"></div>
              <span className="mx-4 text-xs font-medium uppercase text-srf-muted">o</span>
              <div className="flex-grow border-t border-srf-border"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading || resetLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-srf-border bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-srf-primary/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
              Continuar con Google
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading || loading}
              className="w-full rounded-xl border border-srf-border bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-srf-primary/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Enviando..." : "Olvidé mi contraseña"}
            </button>

            <div className="mt-6 text-center text-sm text-srf-muted">
              ¿No tienes una cuenta?{' '}
              <Link href={`${publicUrl}/onboarding`} className="text-srf-primary hover:text-srf-primary/80 font-semibold transition-colors">
                Crear cuenta
              </Link>
            </div>
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
