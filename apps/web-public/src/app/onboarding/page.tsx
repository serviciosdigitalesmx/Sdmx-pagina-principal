"use client";

import { useState, type ChangeEvent, type FormEvent } from 'react';

type FormState = {
  workshopName: string;
  email: string;
  password: string;
  phone: string;
};

const initialForm: FormState = {
  workshopName: '',
  email: '',
  password: '',
  phone: '',
};

export default function OnboardingPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!apiUrl) {
        throw new Error('Falta configurar NEXT_PUBLIC_API_URL');
      }

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'No se pudo completar el registro');
      }

      if (payload?.token) {
        window.localStorage.setItem('auth_token', payload.token);
      }

      if (payload?.tenant?.slug) {
        setSuccess(`Registro creado para ${payload.tenant.slug}.`);
      }

      if (payload?.redirectUrl) {
        window.location.assign(payload.redirectUrl);
        return;
      }

      setSuccess('Registro completado. Revisa el acceso generado.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Error inesperado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!apiUrl) {
        throw new Error('Falta configurar NEXT_PUBLIC_API_URL');
      }

      window.location.assign(`${apiUrl}/api/auth/google`);
    } catch (googleError) {
      const message = googleError instanceof Error ? googleError.message : 'Error inesperado';
      setError(message);
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(180deg,#08111f_0%,#0f172a_38%,#f8fafc_38%,#f8fafc_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 text-white shadow-2xl shadow-slate-950/30">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Prueba gratis 14 días</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Registra tu taller y crea tu tenant sin inventar datos.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            El alta genera el tenant, asocia el owner, deja el trial activo y te manda al acceso correspondiente.
          </p>

          <div className="mt-8 space-y-4 text-sm text-slate-300">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              Tenant con `trial_expires_at` y `branding` por defecto.
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              Backend real en Express + Supabase service role.
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              JWT firmado por la API para el flujo de acceso.
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.659 29.351 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.036 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.036 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.161 0 9.93-1.977 13.49-5.196l-6.22-5.257C29.169 35.091 26.715 36 24 36c-5.33 0-9.625-3.317-11.287-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.227 3.471-3.647 6.197-6.034 7.547l.002-.001 6.22 5.257C34.045 39.426 40 35 40 24c0-1.341-.138-2.651-.389-3.917z"/>
              </svg>
              {googleLoading ? 'Redirigiendo a Google…' : 'Continuar con Google'}
            </button>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="workshopName">
                Nombre del taller
              </label>
              <input
                id="workshopName"
                name="workshopName"
                value={form.workshopName}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Taller San Juan"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                Email del dueño
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="dueno@taller.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="+52 81 1234 5678"
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
              disabled={loading || googleLoading}
              className="w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creando tenant…' : 'Comenzar prueba'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
