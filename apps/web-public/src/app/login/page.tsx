"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.10),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(45,212,191,0.08),_transparent_24%),linear-gradient(180deg,#0a0e17_0%,#070b12_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#d4af37]/15 bg-[#0d1320]/85 p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37]/90">Acceso al taller</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-display)]">
            Accede a FIXI con la misma presencia que viste en la landing.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Tu sesión se mantiene protegida y el acceso está pensado para llevarte directo al entorno operativo sin ruido visual.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Sesión segura", "Credenciales cifradas y acceso directo."],
              ["Soporte rápido", "Recuperación por correo en el mismo flujo."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d4af37]/15 bg-[#111827]/92 p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20"
                placeholder="dueno@taller.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="password">
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20"
                placeholder="Tu contraseña"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-6 py-3 font-semibold text-[#f3df9f] transition hover:bg-[#d4af37]/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Acceder a FIXI"}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="w-full rounded-full border border-white/12 px-6 py-3 font-semibold text-white transition hover:border-[#d4af37]/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading ? "Enviando correo..." : "Recuperar contraseña por correo"}
            </button>

            <p className="text-center text-xs uppercase tracking-[0.24em] text-slate-400">
              ¿Aún no tienes acceso? Solicítalo por correo.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
