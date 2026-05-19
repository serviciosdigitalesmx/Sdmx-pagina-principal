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

export default function OnboardingPage() {
  const [form, setForm] = useState<RegisterState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (!apiUrl) {
        throw new Error("API_URL no está configurada.");
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    if (!apiUrl) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }

    window.location.assign(`${apiUrl}/api/auth/google`);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.10),_transparent_30%),radial-gradient(circle_at_20%_20%,_rgba(45,212,191,0.08),_transparent_24%),linear-gradient(180deg,#0a0e17_0%,#070b12_100%)] px-6 py-10 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.05fr]">
        <div className="rounded-[2rem] border border-[#d4af37]/15 bg-[#0d1320]/85 p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-[#d4af37]/90">Prueba Gratuita</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl [font-family:var(--font-display)]">
            Empieza a operar con FIXI hoy mismo.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Regístrate para obtener tu entorno seguro y aislado. Toma el control total de tu taller con el sistema de nueva generación.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              ["Aislamiento Total", "Tu información y la de tus clientes están separadas en silos seguros."],
              ["Sin Tarjeta", "Comienza tu prueba de inmediato sin compromisos iniciales."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#d4af37]/15 bg-[#111827]/92 p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="workshopName">
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20"
                placeholder="Ej. Motor Fix & Co."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="phone">
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
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20"
                placeholder="Ej. 555 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
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
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-[#d4af37]/60 focus:ring-2 focus:ring-[#d4af37]/20"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            {error ? (
              <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 px-6 py-3 font-semibold text-[#f3df9f] transition hover:bg-[#d4af37]/18 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creando cuenta..." : "Comenzar Prueba Gratuita"}
            </button>

            <div className="relative my-4 flex items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="mx-4 text-xs font-medium text-slate-500 uppercase tracking-widest">o</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="w-full rounded-full flex items-center justify-center gap-3 border border-white/12 px-6 py-3 font-semibold text-white transition hover:border-[#d4af37]/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
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
              <Link href="/login" className="text-[#d4af37] font-semibold transition hover:text-[#f3df9f]">
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
