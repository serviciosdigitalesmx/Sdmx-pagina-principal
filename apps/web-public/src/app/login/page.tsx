"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { saveAuthToken } from "@/lib/auth-storage";

type LoginState = {
  email: string;
  password: string;
};

const initialState: LoginState = {
  email: "",
  password: "",
};

function getDashboardRedirectUrl() {
  return new URL("/hub", window.location.origin).toString();
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginState>(initialState);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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

      if (data.session?.access_token) {
        saveAuthToken(data.session.access_token);
      }

      window.location.assign(getDashboardRedirectUrl());
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
          <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Acceso al taller</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-display)]">
            <span className="sm:hidden">Entra al sistema.</span>
            <span className="hidden sm:inline">Entra al entorno operativo de FIXI.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            <span className="sm:hidden">Tu acceso te lleva al workspace del tenant.</span>
            <span className="hidden sm:inline">
              El acceso mantiene la misma presencia visual de la landing, pero te lleva directo al workspace del tenant.
            </span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
              Volver al inicio
            </Link>
            <Link href="/onboarding" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
              Crear tenant
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Sesión segura", "Credenciales cifradas y acceso directo."],
              ["Soporte rápido", "Recuperación por correo en el mismo flujo."],
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
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
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="Tu contraseña"
              />
            </div>

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
              className="w-full rounded-full bg-[#2c6e9f] px-6 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Acceder a FIXI"}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:border-[#2c6e9f]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
