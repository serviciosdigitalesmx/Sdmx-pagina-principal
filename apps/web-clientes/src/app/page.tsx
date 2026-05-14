const brandName = process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_NAME ?? "Portal del cliente";
const workshopName = process.env.NEXT_PUBLIC_WORKSHOP_NAME ?? "tu taller";
const supportEmail = process.env.NEXT_PUBLIC_CUSTOMER_SUPPORT_EMAIL;
const supportPhone = process.env.NEXT_PUBLIC_CUSTOMER_SUPPORT_PHONE;
const trackingUrl = process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL;

const supportEmailHref = supportEmail ? `mailto:${supportEmail}` : undefined;
const supportPhoneHref = supportPhone ? `tel:${supportPhone.replace(/\s+/g, "")}` : undefined;

const steps = [
  "Revisa el estado actual de tu vehículo.",
  "Recibe avisos por WhatsApp o correo cuando haya cambios.",
  "Aprueba trabajos o solicita aclaraciones desde un solo canal.",
  "Recoge tu vehículo con trazabilidad clara y comunicación simple.",
];

const benefits = [
  "Estado del servicio en tiempo real",
  "Comunicación directa con el taller",
  "Historial y seguimiento de tu orden",
  "Experiencia simple desde móvil",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_28%),linear-gradient(180deg,#052e16_0%,#14532d_48%,#f0fdf4_48%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="rounded-[2rem] border border-white/10 bg-emerald-950/95 p-6 text-white shadow-2xl shadow-emerald-950/25 backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Portal del cliente</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {brandName}
              </h1>
              <p className="mt-3 max-w-2xl text-emerald-100/80">
                Consulta tu vehículo, recibe avisos y mantente al tanto del trabajo realizado por {workshopName}.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-emerald-100/75">Acceso</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">Solo clientes del taller</p>
              <p className="text-sm text-emerald-100/60">Sin panel interno ni herramientas administrativas</p>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Seguimiento sencillo
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Todo lo que necesitas para saber qué pasa con tu coche.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Esta experiencia está diseñada para clientes finales: clara, rápida y sin acceso a funciones internas del taller.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="rounded-2xl bg-emerald-50 p-4 text-emerald-950">
                  <p className="font-semibold">{benefit}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 shadow-sm lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Estado del servicio
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">Orden activa</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">En seguimiento</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">Última actualización</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">Notificación reciente recibida</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="text-sm text-slate-500">Taller</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{workshopName}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Un flujo corto para clientes que solo quieren claridad.
            </h2>
          </div>
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-3xl bg-slate-50 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 font-bold text-emerald-900">
                  0{index + 1}
                </div>
                <p className="pt-2 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/25 lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
              Soporte al cliente
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Si necesitas ayuda, escribe o llama directamente.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Este portal no da acceso al dashboard del taller. Su función es informarte y facilitar contacto.
            </p>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Email</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {supportEmail ?? "Configurar NEXT_PUBLIC_CUSTOMER_SUPPORT_EMAIL"}
              </p>
              {supportEmailHref ? (
                <a className="mt-3 inline-block font-semibold text-emerald-300" href={supportEmailHref}>
                  Escribir correo
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Teléfono</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {supportPhone ?? "Configurar NEXT_PUBLIC_CUSTOMER_SUPPORT_PHONE"}
              </p>
              {supportPhoneHref ? (
                <a className="mt-3 inline-block font-semibold text-emerald-300" href={supportPhoneHref}>
                  Llamar ahora
                </a>
              ) : null}
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Tracking</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {trackingUrl ?? "Configurar NEXT_PUBLIC_CUSTOMER_TRACKING_URL"}
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-slate-200 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>Portal para clientes de {workshopName}</p>
          <div className="flex flex-wrap gap-4">
            <span>Sin acceso administrativo</span>
            <span>Sin dashboard interno</span>
            <span>Canales de soporte visibles</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
