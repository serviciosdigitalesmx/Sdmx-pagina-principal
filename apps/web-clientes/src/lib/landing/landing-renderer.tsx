import Image from "next/image";
import Link from "next/link";
import { Badge, SurfaceCard } from "@white-label/ui";
import { LeadForm } from "../lead/lead-form";
import { resolveTenantTheme } from "../theme/theme-resolver";
import type { LandingContent, Tenant } from "../types";

type LandingRendererProps = {
  tenant: Tenant;
  landingContent: LandingContent;
};

function whatsappHref(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function LandingRenderer({ tenant, landingContent }: LandingRendererProps) {
  const theme = resolveTenantTheme(tenant);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `#${tenant.slug}`,
        name: tenant.name,
        telephone: landingContent.contactPhone || tenant.contactPhone || undefined,
        email: landingContent.contactEmail || tenant.contactEmail || undefined,
        address: tenant.contactAddress
          ? {
              "@type": "PostalAddress",
              streetAddress: tenant.contactAddress,
            }
          : undefined,
      },
      {
        "@type": "Service",
        name: landingContent.heroTitle,
        provider: {
          "@type": "LocalBusiness",
          name: tenant.name,
        },
        areaServed: "Local",
        serviceType: landingContent.services?.[0]?.title || "Repair service",
      },
    ],
  };
  const heroTitle = landingContent.heroTitle;
  const heroDescription = landingContent.heroDescription;
  const primaryCtaLabel = landingContent.primaryCtaLabel;
  const primaryCtaHref = landingContent.primaryCtaHref;
  const secondaryCtaLabel = landingContent.secondaryCtaLabel || "Ver estado";
  const secondaryCtaHref = landingContent.secondaryCtaHref || `/t/${tenant.slug}/portal`;
  const contactHref = landingContent.contactHref || tenant.contactEmail || tenant.contactPhone || null;
  const contactLabel = landingContent.contactLabel || "Contacto";
  const whatsapp = whatsappHref(tenant.contactPhone || null);
  const socialLinks = landingContent.socialLinks ?? [];
  const heroImage = theme.imagery.heroImage || theme.imagery.coverImage || tenant.branding.heroImageUrl || tenant.branding.coverImageUrl || tenant.branding.logoUrl || null;

  return (
    <main
      className="min-h-screen px-4 py-6 text-zinc-50"
      style={{
        background: `radial-gradient(circle_at_top, color-mix(in srgb, ${theme.colors.accent} 18%, transparent), transparent 30%), linear-gradient(180deg, ${theme.colors.background} 0%, ${theme.colors.surface} 48%, #020617 100%)`,
      }}
    >
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <SurfaceCard elevated className="p-6 backdrop-blur" style={{ borderColor: theme.colors.border }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-xl font-black">
                {tenant.branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                ) : (
                  <span>{tenant.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Web del tenant</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">{tenant.name}</h1>
                <p className="mt-2 text-sm text-zinc-300">{tenant.slug}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/t/${tenant.slug}/portal`} className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.cta.primaryRadius, boxShadow: theme.cta.shadow }}>
                Ver estado
              </Link>
              <Link href={primaryCtaHref} className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border, borderRadius: theme.cta.secondaryRadius }}>
                {primaryCtaLabel}
              </Link>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20" style={{ borderColor: theme.colors.success }}>
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: theme.colors.accent }}>{landingContent.heroSubtitle ?? "Landing del taller"}</p>
            <h2 className="max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">{heroTitle}</h2>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">{heroDescription}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className="inline-flex items-center justify-center rounded-2xl px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.cta.primaryRadius }}>
                {primaryCtaLabel}
              </Link>
              <Link href={secondaryCtaHref} className="inline-flex items-center justify-center rounded-2xl border px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border, borderRadius: theme.cta.secondaryRadius }}>
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <aside className="space-y-4">
            <SurfaceCard elevated className="overflow-hidden p-0" style={{ borderColor: theme.colors.border }}>
              {heroImage ? (
                <div className="relative min-h-[18rem] w-full">
                  <Image src={heroImage} alt={tenant.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
                </div>
              ) : (
                <div className="flex min-h-[18rem] items-center justify-center p-8 text-center text-zinc-400">
                  Sube una imagen del tenant para mostrarla aquí.
                </div>
              )}
            </SurfaceCard>
            <SurfaceCard elevated className="p-6" style={{ borderColor: theme.colors.border }}>
              <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Servicios</p>
              <div className="mt-5 grid gap-4">
                {(landingContent.services ?? []).length > 0 ? (landingContent.services ?? []).map((service) => (
                  <div key={service.title} className="rounded-2xl border border-white/10 bg-white/5 p-4" style={{ borderColor: theme.colors.border }}>
                    <p className="font-semibold text-zinc-50">{service.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-300">{service.description}</p>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed bg-white/5 p-4 text-sm text-zinc-300" style={{ borderColor: theme.colors.border }}>
                    No hay servicios configurados para este tenant.
                  </div>
                )}
              </div>
            </SurfaceCard>
          </aside>
        </section>

        <SurfaceCard elevated className="p-6" style={{ borderColor: theme.colors.border }}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Redes sociales</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.length > 0 ? socialLinks.map((link) => (
              <Badge key={link.label} variant="neutral" className="rounded-full px-4 py-2 text-[11px]">
                {link.label}
              </Badge>
            )) : (
              <p className="text-sm text-zinc-300">No hay redes sociales configuradas para este tenant.</p>
            )}
          </div>
        </SurfaceCard>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadForm
            tenantSlug={tenant.slug}
            tenantName={tenant.name}
            contactPhone={tenant.contactPhone || null}
            contactEmail={tenant.contactEmail || null}
          />

          <SurfaceCard elevated className="space-y-4 p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Acciones rápidas</p>
            <a href={whatsapp ?? undefined} target="_blank" rel="noreferrer" className="block rounded-full px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.success, borderRadius: theme.cta.primaryRadius, pointerEvents: whatsapp ? "auto" : "none", opacity: whatsapp ? 1 : 0.5 }}>
              Abrir WhatsApp
            </a>
            {contactHref ? (
              <a href={contactHref} className="block rounded-full border px-5 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border, borderRadius: theme.cta.secondaryRadius }}>
                Contacto directo
              </a>
            ) : null}
            {tenant.contactAddress ? (
              <a href={landingContent.showMap && landingContent.mapEmbedUrl ? landingContent.mapEmbedUrl : `https://www.google.com/maps/search/${encodeURIComponent(tenant.contactAddress)}`} target="_blank" rel="noreferrer" className="block rounded-full border px-5 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border, borderRadius: theme.cta.secondaryRadius }}>
                Abrir mapa
              </a>
            ) : null}
            <Link href={`/t/${tenant.slug}/portal`} className="block rounded-full px-5 py-3 text-center text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.cta.primaryRadius }}>
              Consultar portal
            </Link>
          </SurfaceCard>
        </section>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <SurfaceCard elevated className="p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Contacto</p>
            <div className="mt-4 space-y-2 text-zinc-300">
              {landingContent.hours ? <p>Horario: {landingContent.hours}</p> : null}
              {tenant.contactPhone ? <p>Tel: {tenant.contactPhone}</p> : null}
              {tenant.contactEmail ? <p>Email: {tenant.contactEmail}</p> : null}
              {tenant.contactAddress ? <p>Dirección: {tenant.contactAddress}</p> : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.success, borderRadius: theme.cta.primaryRadius }}>
                  WhatsApp CTA
                </a>
              ) : null}
              {contactHref ? (
                <a href={contactHref} className="inline-flex items-center justify-center rounded-full border bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border, borderRadius: theme.cta.secondaryRadius }}>
                  {contactLabel}
                </a>
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard elevated className="p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Cotización</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Si el backend expone un endpoint real de solicitud o cotización, aquí se conecta el flujo de alta sin contenido falso.
            </p>
            <Link href={primaryCtaHref} className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.cta.primaryRadius }}>
              {primaryCtaLabel}
            </Link>
          </SurfaceCard>
        </section>
      </section>
    </main>
  );
}
