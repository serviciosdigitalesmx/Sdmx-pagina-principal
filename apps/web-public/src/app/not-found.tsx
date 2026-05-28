import Link from "next/link";
import { requireEnv } from "@white-label/config";

export default function NotFound() {
  const brandShort = requireEnv("NEXT_PUBLIC_SAAS_BRAND_SHORT");
  const productName = requireEnv("NEXT_PUBLIC_SAAS_BRAND_NAME");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_35%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] px-4 py-16 text-zinc-50 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl text-center space-y-8 px-4">
        {/* Animated Visual Accent */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-slate-500 to-slate-400 opacity-25 blur-xl group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-950/90 text-2xl font-black text-zinc-50 shadow-[0_24px_50px_rgba(0,0,0,0.3)]">
              {brandShort}
            </div>
          </div>
        </div>

        {/* 404 SVG Illustration */}
        <div className="flex justify-center my-6">
          <svg
            className="w-full max-w-xs text-slate-400 animate-[bounce_3s_infinite]"
            viewBox="0 0 240 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M30 80h40M45 40v50M110 30c-15 0-25 15-25 35s10 35 25 35 25-15 25-35-10-35-25-35zm70 50h40M195 40v50"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="110" cy="65" r="10" fill="currentColor" className="animate-pulse" />
          </svg>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] font-semibold text-slate-300">Error 404</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl [font-family:var(--font-cormorant)]">
            Página no encontrada
          </h1>
          <p className="max-w-md mx-auto text-base leading-7 text-zinc-300">
            Lo sentimos, el enlace que intentas seguir no existe, ha sido movido o el tenant que buscas no está disponible en este momento.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-slate-500 px-8 py-4 text-base font-semibold text-zinc-950 shadow-[0_12px_30px_rgba(168,85,247,0.18)] hover:bg-slate-400 hover:shadow-[0_12px_35px_rgba(168,85,247,0.24)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Volver a {productName}
          </Link>
        </div>

        {/* Footer Accent */}
          <div className="pt-12 text-xs text-zinc-500 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} FIXIE. Todos los derechos reservados.
          </div>
        </div>
      </main>
  );
}
