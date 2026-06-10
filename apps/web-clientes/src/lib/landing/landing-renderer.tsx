import Image from "next/image";
import Link from "next/link";
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
  const whatsapp = whatsappHref(landingContent.contactPhone || tenant.contactPhone || null);
  const gallery = landingContent.gallery ?? [];
  const aboutTitle = landingContent.aboutTitle?.trim() || "Nosotros";
  const aboutDescription = landingContent.aboutDescription?.trim() || "";
  const socialLinks = landingContent.socialLinks ?? [];

  return (
    <main
      className="min-h-screen px-4 py-6 text-zinc-50"
      style={{
        background: `radial-gradient(circle_at_top, color-mix(in srgb, ${theme.colors.accent} 18%, transparent), transparent 30%), linear-gradient(180deg, ${theme.colors.background} 0%, ${theme.colors.surface} 48%, #020617 100%)`,
      }}
    >
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur" style={{ borderColor: theme.colors.border }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-xl font-black">
                {tenant.branding.logoUrl ? (
                  <Image src={tenant.branding.logoUrl} alt={tenant.name} width={64} height={64} className="h-full w-full object-contain" />
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
        </header>

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

          <aside className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Servicios</p>
            <div className="mt-5 grid gap-4">
              {(landingContent.services ?? []).length > 0 ? (landingContent.services ?? []).map((service) => (
                <div key={service.title} className="rounded-2xl border bg-white/5 p-4" style={{ borderColor: theme.colors.border }}>
                  <p className="font-semibold text-zinc-50">{service.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">{service.description}</p>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed bg-white/5 p-4 text-sm text-zinc-300" style={{ borderColor: theme.colors.border }}>
                  No hay servicios configurados para este tenant.
                </div>
              )}
            </div>
          </aside>
        </section>

        {aboutDescription ? (
            <section className="rounded-[2rem] border bg-white/5 p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>{aboutTitle}</p>
            <p className="mt-4 max-w-4xl text-base leading-8 text-zinc-300">{aboutDescription}</p>
          </section>
        ) : null}

        {gallery.length > 0 ? (
          <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Galería</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight">Evidencia visual del taller</h3>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.length > 0 ? gallery.map((item, index) => (
                <figure key={item.id ?? `${item.url}-${index}`} className="overflow-hidden rounded-[1.75rem] border bg-white/5" style={{ borderColor: theme.colors.border }}>
                  <div className="relative aspect-[4/3]">
                    <Image src={item.url} alt={item.alt || item.caption || `Galería ${index + 1}`} fill className="object-cover" />
                  </div>
                  {item.caption ? <figcaption className="px-4 py-3 text-sm text-zinc-300">{item.caption}</figcaption> : null}
                </figure>
              )) : (
                <div className="rounded-[1.75rem] border border-dashed bg-white/5 p-6 text-sm text-zinc-300 sm:col-span-2 lg:col-span-3" style={{ borderColor: theme.colors.border }}>
                  La galería no tiene contenido real todavía.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {landingContent.testimonials?.length ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Testimonios</p>
            <div className="grid gap-4 lg:grid-cols-3">
              {landingContent.testimonials.map((testimonial) => (
                <article key={`${testimonial.clientName}-${testimonial.date}`} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-sm leading-7 text-zinc-300">{testimonial.comment}</p>
                  <div className="mt-4">
                    <p className="font-semibold text-zinc-50">{testimonial.clientName}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">{testimonial.date}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {landingContent.faqs?.length ? (
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>FAQ</p>
            <div className="grid gap-3">
              {landingContent.faqs.map((faq) => (
                <details key={faq.question} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <summary className="cursor-pointer font-semibold text-zinc-50">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border bg-white/5 p-6" style={{ borderColor: theme.colors.border }}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Redes sociales</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {socialLinks.length > 0 ? socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="rounded-full border px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-white/10" style={{ borderColor: theme.colors.border }}>
                {link.label}
              </a>
            )) : (
              <p className="text-sm text-zinc-300">No hay redes sociales configuradas para este tenant.</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <LeadForm
            tenantSlug={tenant.slug}
            tenantName={tenant.name}
            contactPhone={landingContent.contactPhone || tenant.contactPhone || null}
            contactEmail={landingContent.contactEmail || tenant.contactEmail || null}
          />

          <div className="space-y-4 rounded-[2rem] border bg-white/5 p-6" style={{ borderColor: theme.colors.border }}>
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
          </div>
        </section>

        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border bg-white/5 p-6" style={{ borderColor: theme.colors.border }}>
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
          </div>

          <div className="rounded-[2rem] border bg-white/5 p-6" style={{ borderColor: theme.colors.border }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: theme.colors.accent }}>Cotización</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">
              Si el backend expone un endpoint real de solicitud o cotización, aquí se conecta el flujo de alta sin contenido falso.
            </p>
            <Link href={primaryCtaHref} className="mt-5 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95" style={{ backgroundColor: theme.colors.primary, borderRadius: theme.cta.primaryRadius }}>
              {primaryCtaLabel}
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
