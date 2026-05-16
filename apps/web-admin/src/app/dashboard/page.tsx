const dashboardTitle = process.env.NEXT_PUBLIC_TENANT_DASHBOARD_TITLE ?? "Panel principal";
const dashboardMessage =
  process.env.NEXT_PUBLIC_TENANT_DASHBOARD_MESSAGE ?? "Bienvenido al entorno operativo del taller.";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#d4af37]/12 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.10),transparent_32%),linear-gradient(180deg,#111827_0%,#0b101c_100%)] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#d4af37]/90">Inicio</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl [font-family:var(--font-display)]">
          {dashboardTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{dashboardMessage}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Órdenes activas", "128"],
          ["Tickets hoy", "34"],
          ["Cobros pendientes", "$18,240"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[24px] border border-white/10 bg-white/5 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#d4af37]/20">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">{label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-white/10 bg-[#111827]/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]/90">Operación</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Trabajo de hoy</h3>
          <div className="mt-5 space-y-3">
            {["Recepción abierta", "Inventario actualizado", "Pagos listos para conciliación"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <span>{item}</span>
                <span className="text-[#d4af37]">Activo</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[#d4af37]/12 bg-[#111827]/90 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d4af37]/90">Atajo</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-white">Flujo inmediato</h3>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            El dashboard ya carga con una jerarquía clara para entrar, revisar y actuar sin perder contexto.
          </p>
        </article>
      </section>
    </div>
  );
}
