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
              disabled={loading}
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
