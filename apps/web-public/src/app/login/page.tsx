"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ShellBadge, StatCard, srFixTheme } from "@/components/srfix-theme";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { readAuthToken, saveAuthToken } from "@/lib/auth-storage";

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
  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return new URL("/dashboard", window.location.origin).toString();
  }

  try {
    return new URL("/", adminUrl).toString();
  } catch {
    return new URL("/dashboard", window.location.origin).toString();
  }
}

function getAdminBridgeUrl(token: string) {
  const adminUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL;

  if (!adminUrl) {
    return getDashboardRedirectUrl();
  }

  try {
    const bridgeUrl = new URL("/auth/bridge", adminUrl);
    bridgeUrl.searchParams.set("token", token);
    return bridgeUrl.toString();
  } catch {
    return getDashboardRedirectUrl();
  }
}

async function exchangeSessionForApiToken(accessToken: string) {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_API_URL ||
    "https://sdmx-backend-api.onrender.com"
  ).replace(/\/$/, "");

  if (!apiUrl) {
    throw new Error("API base URL no está configurada.");
  }

  const response = await fetch(`${apiUrl}/api/auth/exchange`, {
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
    const existing = readAuthToken();
    if (existing) {
      window.location.replace(getAdminBridgeUrl(existing));
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

      window.location.replace(getDashboardRedirectUrl());
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
                placeholder="dueno@taller.com"
              />
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
                placeholder="Tu contraseña"
              />
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
