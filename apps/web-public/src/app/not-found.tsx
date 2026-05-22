import Link from "next/link";

export default function NotFound() {
  const brandShort = process.env.NEXT_PUBLIC_SAAS_BRAND_SHORT ?? "FXI";
  const productName = process.env.NEXT_PUBLIC_SAAS_BRAND_NAME ?? "FIXI";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.18),_transparent_35%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#ffffff_100%)] px-4 py-16 text-slate-950 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl text-center space-y-8 px-4">
        {/* Animated Visual Accent */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#2c6e9f] to-[#5e9dc9] opacity-35 blur-xl group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-200 bg-white/90 text-2xl font-black text-slate-900 shadow-[0_24px_50px_rgba(31,41,55,0.12)]">
              {brandShort}
            </div>
          </div>
        </div>

        {/* 404 SVG Illustration */}
        <div className="flex justify-center my-6">
          <svg
            className="w-full max-w-xs text-[#2c6e9f] animate-[bounce_3s_infinite]"
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
          <p className="text-xs uppercase tracking-[0.4em] font-semibold text-[#245a82]">Error 404</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl [font-family:var(--font-cormorant)]">
            Página no encontrada
          </h1>
          <p className="max-w-md mx-auto text-base leading-7 text-slate-600">
            Lo sentimos, el enlace que intentas seguir no existe, ha sido movido o el tenant que buscas no está disponible en este momento.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#2c6e9f] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(44,110,159,0.25)] hover:bg-[#245a82] hover:shadow-[0_12px_35px_rgba(44,110,159,0.35)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Volver a {productName}
          </Link>
        </div>

        {/* Footer Accent */}
        <div className="pt-12 text-xs text-slate-400 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} Servicios Digitales MX. Todos los derechos reservados.
        </div>
      </div>
    </main>
  );
}
