"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ShellBadge, StatCard, srFixTheme } from "@/components/srfix-theme";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";
import { getPublicApiPath } from "@/lib/public-api";
import { resolveAdminBridgeUrl } from "@/lib/admin-url";

type LoginState = {
  email: string;
  password: string;
  rememberDevice: boolean;
};

const initialState: LoginState = {
  email: "",
  password: "",
  rememberDevice: true,
};

function getDashboardRedirectUrl() {
  return new URL("/dashboard", window.location.origin).toString();
}

function getAdminBridgeUrl(token: string) {
  return resolveAdminBridgeUrl(token) ?? getDashboardRedirectUrl();
}

function getGoogleOnboardingUrl() {
  const url = new URL(getPublicApiPath("/api/auth/google"), window.location.origin);
  url.searchParams.set("origin", window.location.origin);
  return url.toString();
}

async function exchangeSessionForApiToken(accessToken: string) {
  const response = await fetch(getPublicApiPath("/api/auth/exchange"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accessToken }),
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string; token?: string };

  if (!response.ok || !payload.token) {
    throw new Error(payload.error || `No pudimos convertir la sesión. HTTP ${response.status}`);
  }

  return payload.token;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginState>(initialState);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const adminLoginUrl = resolveAdminUrl() ? `${resolveAdminUrl()}/login` : null;
    const existing = readAuthToken();

    if (existing) {
      window.location.replace(getAdminBridgeUrl(existing));
    } else if (adminLoginUrl) {
      window.location.replace(adminLoginUrl);
    }
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getBrowserSupabaseClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (signInError) {
        throw signInError;
      }

      const accessToken = data.session?.access_token;

      if (accessToken) {
        const apiToken = await exchangeSessionForApiToken(accessToken);
        saveAuthToken(apiToken, form.rememberDevice);
        window.location.replace(getAdminBridgeUrl(apiToken));
        return;
      }

      window.location.replace(getAdminBridgeUrl(readAuthToken() ?? ""));
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!form.email.trim()) {
        throw new Error("Escribe tu correo primero");
      }

      const supabase = getBrowserSupabaseClient();
      const redirectTo = new URL("/login/reset-password", window.location.origin).toString();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email.trim(), {
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

  const handleGoogleRegister = () => {
    const url = getGoogleOnboardingUrl();
    if (!url) {
      setError("Falta configurar la URL del API.");
      return;
    }

    window.location.assign(url);
  };

  return (
    <main className="min-h-screen px-6 py-10 text-zinc-100" style={{ background: srFixTheme.background }}>
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className={`${srFixTheme.surface} p-8`}>
          <ShellBadge>Acceso al taller</ShellBadge>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl [font-family:var(--font-display)]">
            <span className="sm:hidden">Entra al sistema.</span>
            <span className="hidden sm:inline">Entra a FIXI.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-stone-300">
            Tu acceso te lleva directo al área de trabajo del taller y mantiene tu sesión en este dispositivo hasta que cierres sesión.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-stone-700 bg-white/5 px-5 py-3 font-semibold text-zinc-100 transition hover:border-amber-500/30 hover:bg-white/10">
              Volver al inicio
            </Link>
            <Link href="/onboarding" className="rounded-full border border-stone-700 bg-white/5 px-5 py-3 font-semibold text-zinc-100 transition hover:border-amber-500/30 hover:bg-white/10">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <StatCard value="24/7" label="sesión persistente" />
            <StatCard value="Supabase" label="inicio seguro real" />
          </div>
          <p className="mt-6 text-sm leading-7 text-stone-400">
            El acceso está conectado al backend real y respeta el tenant del usuario. No hay sesión simulada ni panel falso.
          </p>
        </div>

        <div className={`${srFixTheme.surface} p-8`}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-stone-500 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15"
              />
              <p className="mt-1 text-xs text-stone-400">Correo de acceso del administrador o dueño del taller.</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 text-zinc-100 outline-none transition placeholder:text-stone-500 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15"
              />
              <p className="mt-1 text-xs text-stone-400">Contraseña de acceso asociada a esa cuenta.</p>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 text-sm text-stone-300">
              <input
                type="checkbox"
                name="rememberDevice"
                checked={form.rememberDevice}
                onChange={handleChange}
                className="h-4 w-4 rounded border-stone-500 text-amber-500 focus:ring-amber-500"
              />
              Recordarme en este dispositivo
            </label>

            {error ? (
              <p className="rounded-2xl border border-rose-900/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl border border-emerald-900/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-amber-50 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Entrar al panel"}
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-stone-700"></div>
              <span className="mx-4 text-xs font-medium uppercase tracking-widest text-stone-500">o</span>
              <div className="flex-grow border-t border-stone-700"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-700 bg-white/5 px-6 py-3 font-semibold text-zinc-100 transition hover:border-amber-500/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
              className="w-full rounded-full border border-stone-700 bg-white/5 px-6 py-3 font-semibold text-zinc-100 transition hover:border-amber-500/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Enviando..." : "Olvidé mi contraseña"}
            </button>

            <p className="text-center text-xs uppercase tracking-[0.24em] text-stone-500">
              El acceso se valida con Supabase y tu API real
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
