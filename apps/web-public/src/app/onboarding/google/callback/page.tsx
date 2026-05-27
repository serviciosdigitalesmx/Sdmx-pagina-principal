"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { saveAuthToken } from "@/lib/auth-storage";
import { ShellBadge, srFixTheme } from "@/components/srfix-theme";

type GoogleSessionState = {
  email: string;
  workshopName: string;
  phone: string;
};

export default function GoogleCallbackPage() {
  const [form, setForm] = useState<GoogleSessionState>({
    email: "",
    workshopName: "",
    phone: "",
  });
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_API_URL ||
    "https://sdmx-backend-api.onrender.com"
  ).replace(/\/$/, "");

  useEffect(() => {
    let mounted = true;

    const finishOAuth = async () => {
      try {
        const supabase = getBrowserSupabaseClient();
        const code = new URL(window.location.href).searchParams.get("code");

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
          throw new Error("No se pudo recuperar la sesión");
        }

        setForm((current) => ({
          ...current,
          email: session.user.email ?? "",
        }));
      } catch (sessionErr) {
        if (!mounted) {
          return;
        }

        const message = sessionErr instanceof Error ? sessionErr.message : "Error inesperado";
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
        throw new Error("Falta configurar la URL del API");
      }

      const supabase = getBrowserSupabaseClient();
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error("La sesión no está disponible");
      }

      const response = await fetch(`${apiUrl}/api/auth/google/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workshopName: form.workshopName,
          phone: form.phone,
          accessToken,
          origin: window.location.origin,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo completar el alta");
      }

      if (payload?.token) {
        saveAuthToken(payload.token);
      }

      if (payload?.redirectUrl) {
        window.location.assign(payload.redirectUrl);
        return;
      }

      setSuccess("Alta completada correctamente.");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error inesperado";
      setError(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 text-zinc-100" style={{ background: srFixTheme.background }}>
      <section className={`${srFixTheme.surface} mx-auto grid w-full max-w-4xl gap-8 p-8`}>
        <div>
          <ShellBadge>Google conectado</ShellBadge>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50">Completa los datos del taller</h1>
          <p className="mt-4 text-lg leading-8 text-stone-300">
            La cuenta de Google ya fue validada. Falta el nombre del taller y el teléfono para crear tu espacio de trabajo.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="email">
              Email de Google
            </label>
            <input
              id="email"
              name="email"
              value={form.email}
              readOnly
              className="w-full rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 text-stone-300 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="workshopName">
              Nombre del taller
            </label>
            <input
              id="workshopName"
              name="workshopName"
              value={form.workshopName}
              onChange={handleChange}
              required
              disabled={loadingSession}
              className="w-full rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 outline-none transition focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 disabled:bg-white/10"
              placeholder="Taller San Juan"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300" htmlFor="phone">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              disabled={loadingSession}
              className="w-full rounded-2xl border border-stone-700 bg-white/5 px-4 py-3 outline-none transition focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 disabled:bg-white/10"
              placeholder="+52 81 1234 5678"
            />
          </div>

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
            disabled={loadingSession || loadingSubmit}
            className="w-full rounded-full bg-amber-50 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSubmit ? "Creando tenant…" : loadingSession ? "Validando Google…" : "Completar registro"}
          </button>
        </form>
      </section>
    </main>
  );
}
