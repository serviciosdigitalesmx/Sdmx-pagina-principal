"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { saveAuthToken } from "@/lib/auth-storage";
import Link from "next/link";

type RegisterState = {
  workshopName: string;
  email: string;
  password: string;
  phone: string;
};

const initialState: RegisterState = {
  workshopName: "",
  email: "",
  password: "",
  phone: "",
};

const trialDays = process.env.NEXT_PUBLIC_SAAS_TRIAL_DAYS ?? "14";

export default function OnboardingPage() {
  const [form, setForm] = useState<RegisterState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getApiUrl = () => (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        throw new Error("API base URL no está configurada.");
      }

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workshopName: form.workshopName.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          origin: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error en el registro");
      }

      if (data.token) {
        saveAuthToken(data.token);
      }

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl);
      } else {
        throw new Error("No se recibió URL de redirección válida del servidor");
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Error inesperado al crear la cuenta";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setError("Falta configurar NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    const url = new URL(`${apiUrl}/api/auth/google`);
    url.searchParams.set("origin", window.location.origin);
    window.location.assign(url.toString());
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(94,157,201,0.08),_transparent_24%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_54%,#ffffff_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Prueba Gratuita</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-display)]">
            Empieza a operar con FIXIE hoy mismo.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Regístrate para obtener tu entorno seguro y aislado. Toma el control total de tu taller con el sistema de nueva generación.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
              ["Aislamiento Total", "Tu información y la de tus clientes están separadas en silos seguros."],
              ["Sin Tarjeta", `Comienza tu prueba de ${trialDays} días sin compromisos iniciales.`],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-900 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="workshopName">
                Nombre del Taller
              </label>
              <input
                id="workshopName"
                name="workshopName"
                type="text"
                autoComplete="organization"
                value={form.workshopName}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="Ej. Motor Fix & Co."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="phone">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={handleChange}
                required
                minLength={7}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="Ej. 555 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600" htmlFor="email">
                Correo Electrónico
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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-[#2c6e9f] px-6 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Comenzar Prueba Gratuita"}
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="mx-4 text-xs font-medium uppercase tracking-widest text-slate-500">o</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:border-[#2c6e9f]/30 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                  fill="#EA4335"
                />
                <path
                  d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                  fill="#4285F4"
                />
                <path
                  d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                  fill="#FBBC05"
                />
                <path
                  d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                  fill="#34A853"
                />
              </svg>
              Continuar con Google
            </button>

            <p className="text-center text-xs text-slate-400 mt-6">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="font-semibold text-[#245a82] transition hover:text-[#2c6e9f]">
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
