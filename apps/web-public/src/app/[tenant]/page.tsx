import Link from "next/link";
import type { ReactNode } from "react";
import { ShellBadge, srFixTheme } from "@/components/srfix-theme";

type LandingResponse = {
  success: true;
  data: {
    tenant: {
      id: string;
      slug: string;
      name: string;
      contactPhone?: string | null;
      contactEmail?: string | null;
      contact_phone?: string | null;
      contact_email?: string | null;
      branding?: { primaryColor?: string; secondaryColor?: string; logoUrl?: string } | null;
    };
    landingContent: {
      heroTitle: string;
      heroSubtitle: string;
      heroDescription: string;
      primaryCtaLabel: string;
      primaryCtaHref: string;
      secondaryCtaLabel: string;
      secondaryCtaHref: string;
      contactLabel: string;
      contactHref: string;
      seoTitle: string;
      seoDescription: string;
      services: Array<{ title: string; description: string }>;
      socialLinks: Array<{ label: string; href: string }>;
      showMap: boolean;
      mapEmbedUrl: string;
      showVideo: boolean;
      videoUrl: string;
    };
  };
};

function resolveApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

function resolveWhatsappHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

async function getTenantLanding(tenant: string): Promise<LandingResponse["data"]> {
  const apiBaseUrl = resolveApiBaseUrl();
  if (!apiBaseUrl) throw new Error("NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL no está configurada");
  const response = await fetch(`${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenant)}/landing`, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as LandingResponse | { error?: string } | null;
  if (!response.ok || !payload || !("success" in payload)) {
    throw new Error((payload && "error" in payload && payload.error) || "No pudimos cargar la landing del tenant");
  }
  return payload.data;
}

function CTA({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-sky-400/70 bg-sky-500 text-white shadow-[0_0_0_1px_rgba(96,165,250,0.18),0_18px_45px_rgba(59,130,246,0.35)] hover:-translate-y-0.5 hover:bg-sky-400`
      : `${base} border border-orange-400/80 bg-zinc-50 text-zinc-950 shadow-[0_18px_45px_rgba(249,115,22,0.22)] hover:-translate-y-0.5 hover:bg-zinc-100`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function TenantLandingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const data = await getTenantLanding(tenant);
  const landing = data.landingContent;
  const whatsappHref = resolveWhatsappHref(data.tenant.contactPhone ?? data.tenant.contact_phone ?? landing.contactHref ?? undefined);
  const portalHref = `/${tenant}/portal`;
  const quoteHref = `/${tenant}/cotizar`;
  const trackingHref = `/${tenant}/tracking`;

  return (
    <main className="min-h-screen text-zinc-100" style={{ background: srFixTheme.background }}>
      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-zinc-800/70 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.96))] px-5 py-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-sky-400/25 bg-white p-2 shadow-[0_0_0_1px_rgba(96,165,250,0.15)]">
              {data.tenant.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.tenant.branding.logoUrl} alt={data.tenant.name} className="h-11 w-11 rounded-lg object-contain" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500 text-lg font-black text-white">SF</div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-100/75">SRFIX OFICIAL</p>
              <h1 className="text-2xl font-black tracking-tight text-zinc-50 sm:text-3xl">{data.tenant.name}</h1>
              <p className="text-sm text-zinc-400">Reparación profesional de electrónicos</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="#inicio" className="rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:bg-white/5">
              Inicio
            </Link>
            <Link href={quoteHref} className="rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:bg-white/5">
              Cotizar
            </Link>
            <Link href={portalHref} className="rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300 transition hover:bg-white/5">
              Estado
            </Link>
          </div>
        </header>

        <section id="inicio" className="grid gap-8 px-2 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-sky-500/50 bg-sky-500/10 px-5 py-3 text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">
              <span className="text-lg">★</span>
              5.0 estrellas en Google Maps
            </div>

            <div className="space-y-4">
              <h2 className="max-w-xl text-5xl font-black uppercase leading-[0.92] tracking-tight text-zinc-50 sm:text-7xl">
                <span className="block text-zinc-100">Reparación</span>
                <span className="block text-orange-400">profesional</span>
                <span className="block text-zinc-100">de electrónicos</span>
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
                {landing.heroDescription}
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <CTA href={quoteHref} variant="secondary">
                Cotizar
              </CTA>
              <CTA href={portalHref}>
                Ver estado
              </CTA>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/70 bg-emerald-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Whatsapp
                </a>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.25),transparent_40%),linear-gradient(180deg,rgba(30,41,59,0.9),rgba(17,24,39,0.95))] blur-0" />
            <div className="relative overflow-hidden rounded-[2rem] border border-sky-500/60 bg-[linear-gradient(180deg,rgba(17,24,39,0.92),rgba(3,7,18,0.98))] p-6 shadow-[0_24px_100px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                  <span className="text-base">◉</span>
                  Portal y cotizador
                </div>
                <div className="rounded-full border border-orange-400/50 bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                  En vivo
                </div>
              </div>
              <div className="mt-6 grid gap-4 rounded-[1.75rem] border border-slate-700/70 bg-black/25 p-5">
                <div className="rounded-[1.5rem] border border-slate-700 bg-zinc-950 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-zinc-400">¿Ya dejaste tu equipo?</p>
                  <p className="mt-3 text-2xl font-black uppercase leading-tight text-sky-100 sm:text-3xl">
                    Consulta el estado de tu reparación en tiempo real.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <CTA href={portalHref}>Ir al panel del cliente</CTA>
                    <CTA href={`${portalHref}?folio=SRF-00106`} variant="secondary">
                      Abrir ejemplo
                    </CTA>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-zinc-800 bg-zinc-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Ver estado</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">Lleva al portal del cliente para consultar por folio.</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-zinc-800 bg-zinc-950/80 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-200">Cotización</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">Solicita una cotización y recibe folio real.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 py-8 md:grid-cols-3" aria-label="Servicios">
          {[
            ["Laptops & Surface", "Microsoft Surface, MacBooks y laptops de todas las marcas."],
            ["Tarjetas de video (GPU)", "Reballing, reemplazo de chips y recuperación de tarjetas."],
            ["Consolas & controles", "Reparación express de controles, consolas y joysticks."],
            ["Smartphones & tablets", "Cambio de pantallas, baterías y puertos de carga."],
            ["PCs de escritorio", "Ensamblado, mantenimiento y componentes de alto rendimiento."],
            ["Diagnóstico gratuito", "Evaluación sin costo ni compromiso con seguimiento real."],
          ].map(([title, description]) => (
            <article key={title} className="rounded-[1.5rem] border border-zinc-700/80 bg-white/4 p-6 shadow-[0_14px_55px_rgba(0,0,0,0.18)]">
              <div className="mb-8 text-4xl text-sky-400">▣</div>
              <h3 className="text-xl font-black uppercase tracking-[0.08em] text-zinc-50">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <h2 className="text-4xl font-black uppercase tracking-tight text-zinc-50 sm:text-5xl">Cotizar</h2>
            <p className="max-w-2xl text-lg leading-8 text-zinc-400">
              Sección visible para capturar el problema y disparar el flujo de recepción real.
            </p>
            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-zinc-700 bg-zinc-900/75 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Problema detallado</p>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  El cliente describe la falla, urgencia y equipo. Esto prepara la solicitud para recepción.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-zinc-700 bg-zinc-900/75 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-300">Ver estado</p>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Folio real, estado, fechas importantes, seguimiento y PDF listo para imprimir o guardar.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-700 bg-zinc-950/70 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.26)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Lo que sigue</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-zinc-100">1. Cotizar</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">El usuario llena datos del equipo y la falla.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-zinc-100">2. Ver estado</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">Consulta el portal con el folio real.</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                <p className="text-sm font-semibold text-zinc-100">3. Imprimir / PDF</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">Se abre el PDF real de la cotización o reparación.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.95))] p-6 lg:grid-cols-[1fr_0.92fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">Ubicación</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-zinc-50 sm:text-4xl">Visítanos en Plaza Chapultepec</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
              Ubicados en el corazón de San Nicolás de los Garza, fácil acceso y estacionamiento disponible.
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Dirección", "Av. Juan Pablo II 310, Plaza Chapultepec, San Nicolás de los Garza, N.L."],
                ["Horario", "Lunes a Sábado: 11:00 a.m. - 8:00 p.m. · Domingo: Cerrado"],
                ["Teléfono / WhatsApp", data.tenant.contactPhone ?? data.tenant.contact_phone ?? "81 1700 6536"],
                ["Ubicación exacta", "Dentro de Plaza Chapultepec, local en planta baja"],
              ].map(([title, value]) => (
                <div key={title} className="rounded-[1.4rem] border border-sky-400/25 bg-white/4 px-5 py-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-400">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <CTA href={portalHref}>Ver estado</CTA>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/70 bg-emerald-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Cómo llegar
                </a>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-sky-500/60 bg-zinc-950 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
            <iframe
              title="Ubicación SrFix"
              src={landing.mapEmbedUrl || "https://www.google.com/maps?q=Plaza%20Chapultepec%20San%20Nicol%C3%A1s&output=embed"}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-zinc-800 py-8 text-center text-sm text-zinc-500 md:flex-row md:text-left">
          <p>© 2026 SrFix Oficial. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={trackingHref} className="text-sky-300 transition hover:text-sky-200">
              Ver estado
            </Link>
            <Link href={quoteHref} className="text-sky-300 transition hover:text-sky-200">
              Cotizar
            </Link>
            <Link href={`/t/${tenant}/portal`} className="text-sky-300 transition hover:text-sky-200">
              Portal del cliente
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  try {
    const data = await getTenantLanding(tenant);
    return {
      title: data.landingContent.seoTitle || data.tenant.name,
      description: data.landingContent.seoDescription || `Landing pública del taller ${data.tenant.name}.`,
    };
  } catch {
    return { title: tenant, description: "Landing pública del taller." };
  }
}
