import Link from "next/link";

const contactPhone = process.env.NEXT_PUBLIC_SAAS_CONTACT_PHONE;
const whatsappHref = contactPhone ? `https://wa.me/${contactPhone.replace(/\D/g, "")}` : undefined;

const experienceCards = [
  ["Cotización", "Convierte el primer contacto en una solicitud clara y lista para atender."],
  ["Tracking", "Consulta el avance del equipo sin llamadas repetidas ni fricción."],
  ["Panel del cliente", "Entrada segura al flujo privado del tenant cuando ya existe sesión."],
];

const serviceBlocks = [
  ["Recepción", "Entrada de equipo, cotización y seguimiento."],
  ["Estado", "Folio, avance y consulta rápida."],
  ["Contacto", "WhatsApp y atención directa."],
  ["Cliente", "Panel privado y seguimiento."],
  ["Operación", "Clientes, stock, finanzas y seguridad."],
  ["Multi-tenant", "Experiencia por marca y sucursal."],
];

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.16),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#f8fafc_48%,#ffffff_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-slate-200 bg-white/92 p-6 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Landing pública por tenant</p>
              <p className="mt-3 inline-flex rounded-full border border-[#2c6e9f]/20 bg-[#2c6e9f]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#245a82]">
                Cotización + Estado + WhatsApp + Panel
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl [font-family:var(--font-cormorant)]">{tenant}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:leading-8">
                <span className="sm:hidden">Cotiza, consulta estado y entra al panel.</span>
                <span className="hidden sm:inline">
                  La experiencia 3 en 1 del tenant {tenant}: cotizar, consultar el estado y entrar al panel del cliente sin perder la
                  identidad del taller.
                </span>
              </p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
              <Link href={`/${tenant}/tracking`} className="rounded-2xl bg-[#2c6e9f] px-5 py-4 font-semibold text-white transition hover:bg-[#245a82]">
                Ver estatus de mi equipo
              </Link>
              <Link href={`/${tenant}/cotizar`} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
                Solicitar cotización
              </Link>
              <a href={whatsappHref ?? "#contacto"} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
                WhatsApp / contacto
              </a>
              <Link href={`/t/${tenant}/portal`} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
                Portal del cliente
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {experienceCards.map(([title, copy]) => (
            <article key={title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245a82]">Servicio</p>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245a82]">Operación pública</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 [font-family:var(--font-cormorant)]">
              {tenant} vende, atiende y rastrea desde una sola experiencia.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              La landing del tenant prioriza conversión y contacto directo. El usuario encuentra rápido cotización, tracking y salida
              elegante hacia el panel privado.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Flujo visible</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {serviceBlocks.map(([label, copy]) => (
                <li key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="font-semibold text-slate-950">{label}:</span> {copy}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="contacto" className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)] lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#245a82]">Contacto</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950 [font-family:var(--font-cormorant)]">
              Cotización, soporte y panel deben sentirse como una sola historia.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Esta vista mantiene el tenant al frente para que el cliente no dude dónde está, qué puede hacer y cómo volver al taller.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href={`/${tenant}/cotizar`} className="rounded-2xl bg-[#2c6e9f] px-5 py-4 font-semibold text-white transition hover:bg-[#245a82]">
              Cotizar ahora
            </Link>
            <Link href={`/${tenant}/tracking`} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
              Ver estado
            </Link>
            <Link href={`/t/${tenant}/portal`} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
              Ingresar al portal
            </Link>
            <a href={whatsappHref ?? "#"} className="rounded-2xl border border-slate-300 px-5 py-4 font-semibold text-slate-800 transition hover:bg-slate-50">
              WhatsApp
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
