"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase-browser';

type GoogleSessionState = {
  email: string;
  workshopName: string;
  phone: string;
};

export default function GoogleCallbackPage() {
  const [form, setForm] = useState<GoogleSessionState>({
    email: '',
    workshopName: '',
    phone: '',
  });
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    let mounted = true;

    const finishOAuth = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const code = new URL(window.location.href).searchParams.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (sessionError) {
          throw sessionError;
        }

        const session = data.session;

        if (!session?.access_token) {
          throw new Error('No se pudo recuperar la sesión de Google');
        }

        setForm((current) => ({
          ...current,
          email: session.user.email ?? '',
        }));
      } catch (sessionErr) {
        if (!mounted) {
          return;
        }

        const message = sessionErr instanceof Error ? sessionErr.message : 'Error inesperado';
        setError(message);
      } finally {
        if (mounted) {
          setLoadingSession(false);
        }
      }
    };

    void finishOAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingSubmit(true);
    setError(null);
    setSuccess(null);

    try {
      if (!apiUrl) {
        throw new Error('Falta configurar NEXT_PUBLIC_API_URL');
      }

      const supabase = getBrowserSupabaseClient();
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error('La sesión de Google no está disponible');
      }

      const response = await fetch(`${apiUrl}/api/auth/google/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workshopName: form.workshopName,
          phone: form.phone,
          accessToken,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? 'No se pudo completar el alta con Google');
      }

      if (payload?.token) {
        window.localStorage.setItem('auth_token', payload.token);
      }

      if (payload?.redirectUrl) {
        window.location.assign(payload.redirectUrl);
        return;
      }

      setSuccess('Alta completada correctamente.');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Error inesperado';
      setError(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#0f172a_38%,#f8fafc_38%,#f8fafc_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-3xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Google conectado</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Completa los datos del taller</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            La cuenta de Google ya fue validada. Falta el nombre del taller y el teléfono para crear el tenant sin inventar información.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
              Email de Google
            </label>
            <input
              id="email"
              name="email"
              value={form.email}
              readOnly
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
            />
          </div>

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
              disabled={loadingSession}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:bg-slate-100"
              placeholder="Taller San Juan"
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
              disabled={loadingSession}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 disabled:bg-slate-100"
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
            disabled={loadingSession || loadingSubmit}
            className="w-full rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSubmit ? 'Creando tenant…' : loadingSession ? 'Validando Google…' : 'Completar registro'}
          </button>
        </form>
      </section>
    </main>
  );
}
