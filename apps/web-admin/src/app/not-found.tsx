import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl text-center space-y-8 px-4">
        {/* Animated Cyber-themed Hexagon SVG */}
        <div className="flex justify-center relative">
          <div className="absolute -inset-4 rounded-full bg-[#2c6e9f]/20 blur-2xl animate-pulse"></div>
          <svg
            className="w-40 h-40 text-[#2c6e9f] relative"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="50,5 95,25 95,75 50,95 5,75 5,25"
              stroke="currentColor"
              strokeWidth="2"
              className="animate-[spin_12s_linear_infinite]"
              strokeDasharray="6 6"
            />
            <polygon
              points="50,15 85,30 85,70 50,85 15,70 15,30"
              stroke="#5e9dc9"
              strokeWidth="1.5"
              className="animate-[spin_8s_linear_infinite_reverse]"
            />
            <text
              x="50"
              y="58"
              fill="currentColor"
              fontSize="24"
              fontWeight="900"
              textAnchor="middle"
              className="font-mono tracking-widest select-none"
            >
              404
            </text>
          </svg>
        </div>

        {/* Text Details */}
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-[#5e9dc9]">
            [SYSTEM ERROR: ROUTE_NOT_FOUND]
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Sección no disponible
          </h1>
          <p className="max-w-md mx-auto text-sm leading-6 text-slate-400 font-sans">
            La ruta o recurso administrativo que estás intentando acceder no existe o tus credenciales de sucursal no coinciden.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-[#2c6e9f] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(44,110,159,0.2)] hover:bg-[#245a82] hover:shadow-[0_10px_25px_rgba(44,110,159,0.3)] transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/40 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 transform hover:-translate-y-0.5"
          >
            Cerrar sesión / Salir
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-8 text-[11px] font-mono text-slate-500">
          Terminal Console v2.6.5 · serviciosdigitalesmx
        </div>
      </div>
    </main>
  );
}
