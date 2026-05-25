"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
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
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(94,157,201,0.08),_transparent_24%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_54%,#ffffff_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Acceso al taller</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-display)]">
            <span className="sm:hidden">Entra al sistema.</span>
            <span className="hidden sm:inline">Entra a FIXI.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Tu acceso te lleva directo al área de trabajo del taller y mantiene tu sesión en este dispositivo hasta que cierres sesión.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
              Volver al inicio
            </Link>
            <Link href="/onboarding" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Sesión persistente", "Si marcas recordar dispositivo, el acceso queda guardado."],
              ["Inicio seguro", "La sesión se valida con Supabase y tu API real."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="email">
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#334155] focus:ring-2 focus:ring-[#334155]/20"
                placeholder="dueno@taller.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="password">
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#334155] focus:ring-2 focus:ring-[#334155]/20"
                placeholder="Tu contraseña"
              />
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="rememberDevice"
                checked={form.rememberDevice}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-[#334155] focus:ring-[#334155]"
              />
              Recordarme en este dispositivo
            </label>

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#334155] px-6 py-3 font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Acceder a FIXI"}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:border-[#334155]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Enviando correo..." : "Recuperar contraseña por correo"}
            </button>

            <p className="text-center text-xs uppercase tracking-[0.24em] text-slate-500">
              ¿Aún no tienes acceso? Solicítalo por correo.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
