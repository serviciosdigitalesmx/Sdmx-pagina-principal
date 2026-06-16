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
    <div className="min-h-screen bg-[#0a0f17] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden flex-col justify-between border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(31,126,220,0.22),transparent_42%),linear-gradient(180deg,rgba(8,12,20,0.98),rgba(13,18,28,0.98))] p-10 lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f7edc,#ff6a2a)] shadow-[0_12px_30px_rgba(31,126,220,0.24)]">
                  <span className="text-xl font-black tracking-[0.18em]">FI</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/55">Servicios Digitales MX</p>
                  <h1 className="mt-1 text-4xl font-bold tracking-[0.12em]">{platformBrand}</h1>
                </div>
              </div>
              <p className="max-w-md text-sm leading-6 text-white/65">
                Acceso centralizado para talleres, sucursales y operación diaria.
              </p>
            </div>
            <div className="space-y-2 text-sm text-white/60">
              <p>Inicio de sesión seguro</p>
              <p>Acceso a dashboard y módulos operativos</p>
              <p>Alta y recuperación desde el mismo flujo</p>
            </div>
          </aside>

          <section className="bg-[rgba(14,18,24,0.98)] p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1f7edc,#ff6a2a)] shadow-[0_12px_30px_rgba(31,126,220,0.18)]">
                  <span className="text-xl font-black tracking-[0.18em]">FI</span>
                </div>
                <h1 className="text-3xl font-bold tracking-[0.08em]">{platformBrand}</h1>
                <p className="mt-2 text-sm text-white/65">Panel de administración</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:p-8">
                <h2 className="mb-6 text-center text-2xl font-semibold tracking-[0.05em]">Iniciar sesión</h2>

                <form onSubmit={handleSupabaseLogin} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Correo</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6a2a] focus:ring-1 focus:ring-[#ff6a2a]"
                      placeholder="dueno@taller.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/80">Contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#ff6a2a] focus:ring-1 focus:ring-[#ff6a2a]"
                      placeholder="Tu contraseña"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  {error ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  ) : null}
                  {success ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {success}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#ff6a2a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#e95c1f] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading || resetLoading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </button>

                  <div className="relative my-4 flex items-center">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="mx-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">o</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleRegister}
                    disabled={loading || resetLoading}
                    className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-4 w-4 shrink-0" aria-hidden="true" viewBox="0 0 24 24">
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
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resetLoading ? "Enviando..." : "Olvidé mi contraseña"}
                  </button>

                  <div className="pt-2 text-center text-sm text-white/60">
                    ¿No tienes una cuenta?{' '}
                    <Link href={`${publicUrl}/onboarding`} className="font-semibold text-[#7dc1ff] transition-colors hover:text-[#a7d7ff]">
                      Crear cuenta
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0f17] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-[#1f7edc]" />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}
