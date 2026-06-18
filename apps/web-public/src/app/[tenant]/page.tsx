import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { srFixTheme } from "@/components/srfix-theme";
import { resolveApiBaseUrl as getApiBaseUrl } from "@white-label/config";
import { Badge, SurfaceCard } from "@white-label/ui";

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
      config?: {
        labels?: Record<string, string>;
        templates?: {
          landing?: Record<string, unknown>;
        };
      } | null;
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

function resolveWhatsappHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

async function getTenantLanding(tenant: string): Promise<LandingResponse["data"] | null> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenant)}/landing`, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as LandingResponse | { error?: string } | null;
  if (!response.ok || !payload || !("success" in payload)) {
    return null;
  }
  return payload.data;
}

function CTA({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  const base = "inline-flex items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-sky-400/35 bg-sky-500/15 text-sky-100 hover:border-sky-300/45 hover:bg-sky-500/20`
      : `${base} border border-white/10 bg-white/5 text-slate-100 hover:bg-white/8`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default async function TenantLandingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const data = await getTenantLanding(tenant);
  if (!data) {
    notFound();
  }
  const landing = data.landingContent;
  const templateLanding = data.tenant.config?.templates?.landing ?? {};
  const labels = data.tenant.config?.labels ?? {};
  const services = Array.isArray(templateLanding.services) && templateLanding.services.length > 0 ? templateLanding.services : landing.services;
  const socialLinks = Array.isArray(landing.socialLinks) ? landing.socialLinks : [];
  const heroTitle = typeof templateLanding.heroTitle === "string" && templateLanding.heroTitle.trim().length > 0 ? templateLanding.heroTitle : landing.heroTitle;
  const heroSubtitle = typeof templateLanding.heroSubtitle === "string" && templateLanding.heroSubtitle.trim().length > 0 ? templateLanding.heroSubtitle : landing.heroSubtitle;
  const heroDescription = typeof templateLanding.heroDescription === "string" && templateLanding.heroDescription.trim().length > 0 ? templateLanding.heroDescription : landing.heroDescription;
  const primaryCtaLabel = typeof templateLanding.primaryCtaLabel === "string" && templateLanding.primaryCtaLabel.trim().length > 0 ? templateLanding.primaryCtaLabel : landing.primaryCtaLabel;
  const primaryCtaHref = typeof templateLanding.primaryCtaHref === "string" && templateLanding.primaryCtaHref.trim().length > 0 ? templateLanding.primaryCtaHref : landing.primaryCtaHref;
  const secondaryCtaLabel = typeof templateLanding.secondaryCtaLabel === "string" && templateLanding.secondaryCtaLabel.trim().length > 0 ? templateLanding.secondaryCtaLabel : landing.secondaryCtaLabel;
  const secondaryCtaHref = typeof templateLanding.secondaryCtaHref === "string" && templateLanding.secondaryCtaHref.trim().length > 0 ? templateLanding.secondaryCtaHref : landing.secondaryCtaHref;
  const contactLabel = typeof templateLanding.contactLabel === "string" && templateLanding.contactLabel.trim().length > 0 ? templateLanding.contactLabel : landing.contactLabel;
  const whatsappHref = resolveWhatsappHref(data.tenant.contactPhone ?? data.tenant.contact_phone ?? landing.contactHref ?? undefined);
  const portalHref = `/${tenant}/portal`;
  const quoteHref = `/${tenant}/cotizar`;
  const trackingHref = `/${tenant}/tracking`;

  return (
    <main className="min-h-screen text-slate-100" style={{ background: srFixTheme.background }}>
      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <SurfaceCard elevated className="px-5 py-4 backdrop-blur-xl">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white p-2">
              {data.tenant.branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.tenant.branding.logoUrl} alt={data.tenant.name} className="h-11 w-11 rounded-lg object-contain" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-500/15 text-lg font-black text-sky-100">SF</div>
              )}
            </div>
            <div>
              <Badge variant="neutral">FIXI</Badge>
              <h1 className="text-2xl font-black tracking-tight text-slate-50 sm:text-3xl">{data.tenant.name}</h1>
              <p className="text-sm text-slate-400">{heroSubtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="#inicio" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
              Inicio
            </Link>
            <Link href={quoteHref} className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
              Cotizar
            </Link>
            <Link href={portalHref} className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5">
              Estado
            </Link>
            {socialLinks.slice(0, 2).map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
          </div>
        </header>
        </SurfaceCard>

        <section id="inicio" className="grid gap-8 px-2 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-sky-500/25 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-200">
              Operación real del taller conectada al tenant
            </div>

            <div className="space-y-4">
              <h2 className="max-w-xl text-5xl font-black uppercase leading-[0.92] tracking-tight text-slate-50 sm:text-7xl">
                <span className="block text-slate-100">{heroTitle.split(" ").slice(0, 1).join(" ") || heroTitle}</span>
                <span className="block text-sky-300">{heroTitle.split(" ").slice(1, 2).join(" ") || heroTitle}</span>
                <span className="block text-slate-100">{heroTitle.split(" ").slice(2).join(" ") || heroTitle}</span>
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">{heroDescription}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <CTA href={primaryCtaHref || quoteHref} variant="secondary">
                {primaryCtaLabel}
              </CTA>
              <CTA href={secondaryCtaHref || portalHref}>
                {secondaryCtaLabel}
              </CTA>
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/70 bg-emerald-500 px-5 py-4 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  {contactLabel}
                </a>
              ) : null}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(59,130,246,0.16),transparent_40%),linear-gradient(180deg,rgba(30,41,59,0.85),rgba(17,24,39,0.95))]" />
            <SurfaceCard elevated className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-200">
                  Seguimiento y cotizador
                </div>
                <Badge variant="primary">En vivo</Badge>
              </div>
              <div className="mt-6 grid gap-4 rounded-[1.75rem] border border-slate-700/70 bg-black/25 p-5">
                <div className="rounded-[1.5rem] border border-slate-700 bg-slate-950 p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">¿Ya dejaste tu equipo?</p>
                  <p className="mt-3 text-2xl font-black uppercase leading-tight text-sky-100 sm:text-3xl">
                    Consulta el estado de tu reparación en tiempo real.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <CTA href={portalHref}>Ir al seguimiento</CTA>
                    <CTA href={`${portalHref}?folio=FIX-00106`} variant="secondary">
                      Abrir ejemplo
                    </CTA>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4">
                    <p className="text-xs font-semibold text-sky-200">Ver estado</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Lleva al seguimiento público para consultar por folio.</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/8 bg-white/4 p-4">
                    <p className="text-xs font-semibold text-sky-200">Cotización</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Solicita una cotización y recibe folio real.</p>
                  </div>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </section>

        <section className="grid gap-5 py-8 md:grid-cols-3" aria-label="Servicios">
          {services.map((service) => (
            <SurfaceCard key={service.title} elevated className="p-6">
              <div className="mb-8 text-4xl text-sky-400">▣</div>
              <h3 className="text-xl font-black uppercase tracking-[0.08em] text-slate-50">{service.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{service.description}</p>
            </SurfaceCard>
          ))}
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_0.95fr] lg:items-start">
          <div className="space-y-5">
            <h2 className="text-4xl font-black uppercase tracking-tight text-slate-50 sm:text-5xl">{labels.quote ?? "Cotizar"}</h2>
            <p className="max-w-2xl text-lg leading-8 text-slate-400">
              Sección visible para capturar el problema y disparar el flujo de recepción real.
            </p>
            <div className="grid gap-4">
              <SurfaceCard subtle className="p-5">
                <p className="text-sm font-semibold text-sky-300">Problema detallado</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  El cliente describe la falla, urgencia y equipo. Esto prepara la solicitud para recepción.
                </p>
              </SurfaceCard>
              <SurfaceCard subtle className="p-5">
                <p className="text-sm font-semibold text-sky-300">Ver estado</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Folio real, estado, fechas importantes, seguimiento y PDF listo para imprimir o guardar.
                </p>
              </SurfaceCard>
            </div>
          </div>

          <SurfaceCard elevated className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Lo que sigue</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm font-semibold text-slate-100">1. Cotizar</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">El usuario llena datos del equipo y la falla.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm font-semibold text-slate-100">2. Ver estado</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">Consulta el portal con el folio real.</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="text-sm font-semibold text-slate-100">3. Imprimir / PDF</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">Se abre el PDF real de la cotización o reparación.</p>
              </div>
            </div>
          </SurfaceCard>
        </section>

        <SurfaceCard elevated className="grid gap-6 p-6 lg:grid-cols-[1fr_0.92fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold text-sky-300">Contacto</p>
            <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-slate-50 sm:text-4xl">Atención del taller sin inventar datos</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
              La ubicación, teléfono y enlaces salen de la configuración real del tenant. Si no hay mapa configurado, mostramos contacto directo.
            </p>
            <div className="mt-6 space-y-4">
              {[
                ["Teléfono / WhatsApp", data.tenant.contactPhone ?? data.tenant.contact_phone ?? "No configurado"],
                ["Correo", data.tenant.contactEmail ?? data.tenant.contact_email ?? "No configurado"],
                ["Mapa", landing.showMap && landing.mapEmbedUrl ? "Disponible" : "No configurado"],
                ["Enlaces", socialLinks.length > 0 ? `${socialLinks.length} publicados` : "Sin enlaces publicados"],
              ].map(([title, value]) => (
                <div key={title} className="rounded-[1.4rem] border border-white/8 bg-white/4 px-5 py-4">
                  <p className="text-sm font-semibold text-sky-300">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-400">{value}</p>
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
                  Abrir WhatsApp
                </a>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-slate-950">
            {landing.showMap && landing.mapEmbedUrl ? (
              <iframe
                title={`${data.tenant.name} ubicación`}
                src={landing.mapEmbedUrl}
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-[420px] flex-col justify-between p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Mapa no configurado</p>
                  <p className="mt-4 text-3xl font-black uppercase leading-tight text-slate-50">
                    Publica la ubicación real del taller desde el panel del tenant.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
                    Sin mapa embebido no mostramos una dirección inventada.
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm leading-6 text-slate-400">
                    Configura `landing_content.mapEmbedUrl` o publica enlaces externos reales.
                  </div>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/8 py-8 text-center text-sm text-slate-500 md:flex-row md:text-left">
          <p>© 2026 FIXI. Todos los derechos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href={trackingHref} className="text-sky-300 transition hover:text-sky-200">
              Ver estado
            </Link>
            <Link href={quoteHref} className="text-sky-300 transition hover:text-sky-200">
              Cotizar
            </Link>
            <Link href={`/t/${tenant}/portal`} className="text-sky-300 transition hover:text-sky-200">
              Seguimiento
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
    if (!data) {
      return { title: tenant, description: "Landing pública del taller." };
    }
    return {
      title: data.landingContent.seoTitle || data.tenant.name,
      description: data.landingContent.seoDescription || `Landing pública del taller ${data.tenant.name}.`,
    };
  } catch {
    return { title: tenant, description: "Landing pública del taller." };
  }
}
