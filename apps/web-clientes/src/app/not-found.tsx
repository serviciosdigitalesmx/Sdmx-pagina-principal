import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(27,158,94,0.06),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] flex flex-col items-center justify-center px-4 py-16 text-slate-900">
      <div className="w-full max-w-xl text-center space-y-8 px-4">
        {/* Reassuring high-trust SVG element */}
        <div className="flex justify-center relative">
          <div className="absolute -inset-3 rounded-full bg-[#1b9e5e]/10 blur-xl animate-pulse"></div>
          <svg
            className="w-36 h-36 text-[#1b9e5e] relative"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Clipboard background */}
            <rect x="35" y="25" width="50" height="70" rx="6" stroke="currentColor" strokeWidth="3" fill="white" />
            <rect x="45" y="15" width="30" height="15" rx="3" fill="#2c6e9f" />
            {/* Check lines */}
            <line x1="48" y1="45" x2="72" y2="45" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="60" x2="65" y2="60" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
            {/* Pulsing question mark */}
            <circle cx="78" cy="82" r="14" fill="#e2e8f0" stroke="#1b9e5e" strokeWidth="3" />
            <text
              x="78"
              y="88"
              fill="#1b9e5e"
              fontSize="16"
              fontWeight="bold"
              textAnchor="middle"
              className="select-none"
            >
              ?
            </text>
          </svg>
        </div>

        {/* Reassuring Text */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-[#1b9e5e]">
            Portal de Seguimiento Seguro
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            No encontramos esta sección
          </h1>
          <p className="max-w-md mx-auto text-base leading-7 text-slate-600">
            No te preocupes, tu equipo y los datos de tu reparación están completamente seguros en nuestro sistema. El enlace al que intentas entrar no está disponible o cambió de lugar.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#1b9e5e] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(27,158,94,0.25)] hover:bg-[#15804c] hover:shadow-[0_12px_35px_rgba(27,158,94,0.35)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Ir a Consultar Orden
          </Link>
        </div>

        {/* Trust Seal */}
        <div className="pt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
          <svg className="w-4 h-4 text-[#1b9e5e]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746v6.398c0 4.887-3.328 9.47-7.834 10.602a1.002 1.002 0 01-.668 0c-4.506-1.132-7.834-5.715-7.834-10.602V4.9zm8.5 4.854a1 1 0 10-2 0v3a1 1 0 102 0v-3zm-1-4a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
          Garantía de Privacidad y Seguridad
        </div>
      </div>
    </main>
  );
}
