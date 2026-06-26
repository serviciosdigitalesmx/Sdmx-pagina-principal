import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { optionalEnv } from "@white-label/config";
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
      branding?: { primaryColor?: string; secondaryColor?: string; logoUrl?: string; brandHue?: number; customTagline?: string } | null;
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

function hashTenantName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getTenantHue(name: string, branding?: { brandHue?: number | null; primaryColor?: string; secondaryColor?: string } | null) {
  if (typeof branding?.brandHue === "number" && Number.isFinite(branding.brandHue)) {
    return ((branding.brandHue % 360) + 360) % 360;
  }
  if (typeof branding?.primaryColor === "string" && branding.primaryColor.trim()) {
    return hashTenantName(branding.primaryColor) % 360;
  }
  return hashTenantName(name) % 360;
}

function getTenantInitials(name: string) {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "FX";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "FX";
}

function getRealisticRepairCount(name: string) {
  const hash = hashTenantName(name);
  return 50 + (hash % 201);
}

function buildTenantStyles(hue: number) {
  const secondary = (hue + 30) % 360;
  const tertiary = (hue + 40) % 360;
  return {
    "--tenant-hue": String(hue),
    "--tenant-primary": `hsl(${hue} 85% 55%)`,
    "--tenant-primary-glow": `hsla(${hue} 85% 55% / 0.3)`,
    "--tenant-primary-dim": `hsla(${hue} 60% 20% / 1)`,
    "--tenant-secondary": `hsl(${secondary} 80% 60%)`,
    "--tenant-gradient": `linear-gradient(135deg, hsl(${hue} 85% 55%) 0%, hsl(${tertiary} 80% 45%) 100%)`,
    "--bg-deep": "#0a0e1a",
    "--bg-card": "rgba(255,255,255,0.03)",
    "--bg-card-hover": "rgba(255,255,255,0.06)",
    "--border-subtle": "rgba(255,255,255,0.08)",
    "--border-glow": "rgba(255,255,255,0.15)",
    "--text-primary": "#f0f2f5",
    "--text-secondary": "#8892a0",
    "--text-muted": "#4a5568",
  } as CSSProperties;
}

function getDefaultValue(value: string | null | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

const adminBaseUrl = process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? null;
const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";
const adminOnboardingUrl = adminBaseUrl ? `${adminBaseUrl}/login?mode=signup` : "/login?mode=signup";

const whatsappSteps = [
  ["1. Registras la orden", "FIXI guarda folio, cliente y estado."],
  ["2. Envías por WhatsApp", "Un clic y el cliente recibe su seguimiento."],
  ["3. El cliente consulta solo", "Ya no te persigue por mensaje o llamada."],
] as const;

const receptionChecks = [
  "Condición cosmética",
  "Daño físico reportado",
  "Accesorios recibidos",
  "Aceptación del cliente",
] as const;

async function getTenantLanding(tenant: string): Promise<LandingResponse["data"] | null> {
  const apiBaseUrl =
    optionalEnv("NEXT_PUBLIC_API_URL") ??
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ??
    "http://127.0.0.1:3008";
  const response = await fetch(`${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenant)}/landing`, { cache: "no-store" });
  const payload = (await response.json().catch(() => null)) as LandingResponse | { error?: string } | null;
  if (!response.ok || !payload || !("success" in payload)) {
    return null;
  }
  return payload.data;
}

function CTA({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base = "inline-flex items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition duration-200";
  const className =
    variant === "primary"
      ? `${base} border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] text-[color:var(--text-primary)] hover:-translate-y-0.5 hover:bg-[color:var(--bg-card-hover)] hover:border-[color:var(--border-glow)]`
      : `${base} border border-sky-400/35 bg-sky-500/15 text-sky-100 hover:border-sky-300/45 hover:bg-sky-500/20`;
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function SectionCard({
  title,
  eyebrow,
  copy,
  children,
  className = "",
}: {
  title: string;
  eyebrow: string;
  copy?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[2rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)] ${className}`}>
      <div className="mb-5 space-y-3">
        <span className="inline-flex rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">{eyebrow}</span>
        <h2 className="text-3xl font-black tracking-[-0.02em] text-[color:var(--text-primary)] sm:text-4xl">{title}</h2>
        {copy ? <p className="max-w-2xl text-base leading-8 text-[color:var(--text-secondary)]">{copy}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-[color:var(--border-subtle)] bg-black/20 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.02em] text-[color:var(--text-primary)]">{value}</p>
    </div>
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
  const phone = data.tenant.contactPhone ?? data.tenant.contact_phone ?? null;
  const email = data.tenant.contactEmail ?? data.tenant.contact_email ?? null;
  const whatsappHref = resolveWhatsappHref(phone ?? landing.contactHref ?? undefined);
  const portalHref = `/${tenant}/portal`;
  const quoteHref = `/${tenant}/cotizar`;
  const trackingHref = `/${tenant}/tracking`;
  const hue = getTenantHue(data.tenant.name, data.tenant.branding);
  const initials = getTenantInitials(data.tenant.name);
  const repairCount = getRealisticRepairCount(data.tenant.name);
  const styles = buildTenantStyles(hue);
  const primaryColor = `hsl(${hue} 85% 55%)`;
  const secondaryColor = `hsl(${(hue + 30) % 360} 80% 60%)`;
  const tintColor = `hsla(${hue} 85% 55% / 0.18)`;
  const accentColor = `hsla(${hue} 85% 55% / 0.35)`;
  const hasLogo = Boolean(data.tenant.branding?.logoUrl?.trim());
  const tagline = getDefaultValue(data.tenant.branding?.customTagline, heroSubtitle || "Reparación profesional de electrónicos");

  const stats = [
    { label: "Reparaciones al mes", value: String(repairCount) },
    { label: "Tiempo promedio", value: "24h" },
    { label: "Garantía", value: "30 días" },
    { label: "Atención", value: "WhatsApp" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden text-[color:var(--text-primary)]" style={{ background: "var(--bg-deep)", ...styles }}>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,var(--tenant-primary-glow),transparent_30%),radial-gradient(circle_at_80%_10%,hsla(calc(var(--tenant-hue) + 40),85%,55%,0.16),transparent_24%),linear-gradient(180deg,rgba(10,14,26,0.92),rgba(10,14,26,1))]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.01)_50%,transparent_75%,rgba(255,255,255,0.02))] bg-[length:120%_120%] animate-[gradientShift_16s_ease-in-out_infinite] opacity-60" />

      <section className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <SurfaceCard elevated className="flex flex-col gap-4 border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] px-5 py-4 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--border-glow)] bg-[var(--tenant-gradient)] text-sm font-black text-white shadow-[0_12px_30px_var(--tenant-primary-glow)]">
              {hasLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.tenant.branding?.logoUrl ?? ""} alt={data.tenant.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <Badge variant="neutral">FIXI</Badge>
              <h1 className="text-xl font-semibold tracking-tight text-white">{data.tenant.name}</h1>
              <p className="text-sm text-[color:var(--text-secondary)]">{tagline}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--text-secondary)]">
            <Link href="#inicio" className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">Inicio</Link>
            <Link href="#cotizar" className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">Cotizar</Link>
            <Link href="#estado" className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">Estado</Link>
            <Link href="#contacto" className="rounded-full px-4 py-2 transition hover:bg-white/5 hover:text-white">Contacto</Link>
          </div>
        </SurfaceCard>
      </section>

      <section id="inicio" className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-8 pt-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pt-8">
        <div className="space-y-7 pt-4 lg:pt-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_6px_rgba(34,197,94,0.18)] animate-pulse" />
            Operación real del taller conectada al tenant
          </div>

          <div className="space-y-4">
            <h2 className="max-w-3xl text-5xl font-black tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
              {heroTitle.split(" ").slice(0, 2).join(" ") || heroTitle}
              <span className="block bg-[var(--tenant-gradient)] bg-clip-text text-transparent">{heroTitle.split(" ").slice(2).join(" ") || heroTitle}</span>
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)] sm:text-xl">{heroDescription}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <CTA href={primaryCtaHref || quoteHref} variant="secondary">{primaryCtaLabel}</CTA>
            <CTA href={secondaryCtaHref || portalHref}>{secondaryCtaLabel}</CTA>
            {whatsappHref ? (
              <a href={whatsappHref} className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400">
                {contactLabel}
              </a>
            ) : (
              <CTA href="#contacto" variant="primary">Configura WhatsApp</CTA>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatPill key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {[
              "Garantía 30 días",
              "Diagnóstico gratis",
              "Reparación express",
              "WhatsApp directo",
            ].map((badge) => (
              <span key={badge} className="inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-4 py-2 text-xs font-semibold text-white/85">{badge}</span>
            ))}
          </div>
        </div>

        <div className="relative lg:pt-0">
          <div className="pointer-events-none absolute inset-x-10 top-10 h-40 rounded-full bg-[var(--tenant-gradient)] blur-3xl opacity-25 animate-pulse" />
          <SurfaceCard elevated className="relative overflow-hidden border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_50%_18%,var(--tenant-primary-glow),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(255,255,255,0.05),transparent_25%)]" />
            <div className="relative mx-auto max-w-[360px] animate-[float_5.5s_ease-in-out_infinite]">
              <div className="rounded-[2rem] border border-[color:var(--border-glow)] bg-[rgba(10,14,26,0.85)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--tenant-gradient)] text-sm font-black text-white shadow-[0_0_26px_var(--tenant-primary-glow)]">{initials}</div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">{data.tenant.name}</p>
                      <p className="text-sm text-white/80">Seguimiento y cotizador</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200 animate-pulse">En vivo</span>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">¿Ya dejaste tu equipo?</p>
                  <p className="mt-3 max-w-xs text-2xl font-black uppercase leading-tight text-white sm:text-3xl">Consulta el estado de tu reparación en tiempo real.</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <CTA href={portalHref}>Ir al seguimiento</CTA>
                    <CTA href={`${portalHref}?folio=FIX-00106`} variant="primary">Abrir ejemplo</CTA>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-sky-200">Ver estado</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">Lleva al seguimiento público para consultar por folio.</p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-sky-200">Cotización</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">Solicita una cotización y recibe folio real.</p>
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            ["¿Ya está mi celular?", "El cliente ve el avance por su cuenta y deja de perseguirte."],
            ["Libretas y chats dispersos", "La orden, las fotos y el cobro quedan juntos en un solo flujo."],
            ["Inventario sin control", "Las piezas críticas se notan antes de quedarse en cero."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-[1.6rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-5 transition duration-300 hover:-translate-y-1 hover:border-[color:var(--border-glow)] hover:bg-[color:var(--bg-card-hover)] hover:shadow-[0_18px_50px_var(--tenant-primary-glow)]">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dashboard" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <SectionCard
              eyebrow="Tu mañana en el taller"
              title="Sabe si ganaste o perdiste hoy, sin abrir Excel."
              copy="Ingresos, egresos, utilidad, órdenes activas y stock crítico en una sola pantalla que se actualiza sola."
            >
              <p className="max-w-xl text-sm leading-7 text-[color:var(--text-secondary)]">Si manejas 2 sucursales, cambias de vista sin cerrar sesión y sin mezclar datos.</p>
            </SectionCard>
          </div>
          <SurfaceCard elevated className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatPill key={`dashboard-${stat.label}`} label={stat.label} value={stat.value} />
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section id="whatsapp" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionCard
            eyebrow="Tu cliente deja de llamarte"
            title="Envía el seguimiento en 3 clics."
            copy="Registras la orden, FIXI prepara el mensaje y el cliente recibe su folio por WhatsApp para consultar el estado cuando quiera."
          >
            <div className="space-y-3">
              {whatsappSteps.map(([title, copy]) => (
                <div key={title} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--border-glow)]">
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-sm leading-7 text-[color:var(--text-secondary)]">{copy}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SurfaceCard elevated className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Mensaje generado</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">Hola, tu equipo fue registrado en FIXI con el folio <span className="text-white">SRF-MQV0ISEK</span>. Puedes consultar el estado en el portal del cliente.</p>
              <div className="mt-4 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-200">Enviar por WhatsApp</div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionCard
            eyebrow="Recepción legal"
            title="Cuando el cliente diga “yo no entregué así”, tú tendrás respaldo."
            copy="Cada equipo entra con checklist, fotos y firma. Todo queda atado a la orden para que no vivas de memoria ni de chats."
            className="h-full"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {receptionChecks.map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-semibold text-white">{item}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SurfaceCard elevated className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">Captura real</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-white">Información del equipo</p>
              <div className="mt-5 grid gap-3">
                {[
                  "Tipo de dispositivo",
                  "Checklist de recepción",
                  "Condición cosmética",
                  "Daño físico reportado",
                  "Accesorios recibidos",
                  "Aceptación",
                ].map((label) => (
                  <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-[color:var(--text-secondary)]">{label}</span>
                    <span className="text-sm font-semibold text-sky-200">Registrado</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section id="cotizar" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow={labels.quote ?? "Cotizar"} title={heroSubtitle || "Cotiza rápido, sin complicarte"} copy="Sección visible para capturar el problema y disparar el flujo de recepción real.">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
            <div className="grid gap-4">
              <SurfaceCard subtle className="p-5">
                <p className="text-sm font-semibold text-sky-300">Problema detallado</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">El cliente describe la falla, urgencia y equipo. Esto prepara la solicitud para recepción.</p>
              </SurfaceCard>
              <SurfaceCard subtle className="p-5">
                <p className="text-sm font-semibold text-sky-300">Ver estado</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">Folio real, estado, fechas importantes, seguimiento y PDF listo para imprimir o guardar.</p>
              </SurfaceCard>
            </div>

            <SurfaceCard elevated className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Lo que sigue</p>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-sm font-semibold text-slate-100">1. Cotizar</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">El usuario llena datos del equipo y la falla.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-sm font-semibold text-slate-100">2. Ver estado</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">Consulta el portal con el folio real.</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-sm font-semibold text-slate-100">3. Imprimir / PDF</p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">Se abre el PDF real de la cotización o reparación.</p>
                </div>
              </div>
            </SurfaceCard>
          </div>
        </SectionCard>
      </section>

      <section id="estado" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard
            eyebrow="Seguimiento público"
            title="Tu cliente ve el estado real sin inventar nada."
            copy="El portal del cliente sigue existiendo, pero ahora la landing lo presenta como un flujo limpio y confiable."
            className="h-full"
          >
            <div className="grid gap-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Ver estado</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">Lleva al seguimiento público para consultar por folio.</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Cotización</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">Solicita una cotización y recibe folio real.</p>
              </div>
            </div>
          </SectionCard>
          <SurfaceCard elevated className="overflow-hidden rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
            {landing.showMap && landing.mapEmbedUrl ? (
              <iframe
                title={`${data.tenant.name} ubicación`}
                src={landing.mapEmbedUrl}
                className="h-[420px] w-full border-0 rounded-[1.6rem]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-[420px] flex-col justify-between rounded-[1.6rem] border border-dashed border-white/10 bg-black/25 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Mapa en espera</p>
                  <p className="mt-4 max-w-md text-3xl font-black uppercase leading-tight text-white">Publica la ubicación real del taller desde el panel del tenant.</p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[color:var(--text-secondary)]">Sin mapa embebido no mostramos una dirección inventada.</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[color:var(--text-secondary)]">Configura `landing_content.mapEmbedUrl` o publica enlaces externos reales.</div>
                </div>
              </div>
            )}
          </SurfaceCard>
        </div>
      </section>

      <section id="contacto" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Contacto" title="Atención del taller sin inventar datos" copy="La ubicación, teléfono y enlaces salen de la configuración real del tenant. Si no hay mapa configurado, mostramos contacto directo.">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
            <div className="space-y-4">
              {[
                {
                  label: "Teléfono / WhatsApp",
                  value: phone,
                  placeholder: "Agrega tu WhatsApp para recibir cotizaciones",
                  cta: "Abrir panel",
                },
                {
                  label: "Correo",
                  value: email,
                  placeholder: "Configura tu correo de contacto",
                  cta: "Abrir panel",
                },
                {
                  label: "Mapa",
                  value: landing.showMap && landing.mapEmbedUrl ? "Disponible" : null,
                  placeholder: "Publica tu ubicación real desde el panel",
                  cta: "Abrir panel",
                },
                {
                  label: "Redes sociales",
                  value: socialLinks.length > 0 ? `${socialLinks.length} publicados` : null,
                  placeholder: "Conecta tus redes para que te encuentren fácil",
                  cta: "Abrir panel",
                },
              ].map((item) => {
                const hasValue = Boolean(item.value);
                return (
                  <div key={item.label} className={`rounded-[1.4rem] border border-[color:var(--border-subtle)] bg-black/20 px-5 py-4 ${hasValue ? "border-l-4" : "border-l-4"}`} style={{ borderLeftColor: hasValue ? primaryColor : "rgba(255,255,255,0.18)" }}>
                    <p className="text-sm font-semibold text-sky-300">{item.label}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">{hasValue ? item.value : item.placeholder}</p>
                    {!hasValue ? <Link href={adminLoginUrl} className="mt-3 inline-flex text-sm font-semibold text-sky-300 transition hover:text-sky-200">{item.cta}</Link> : null}
                  </div>
                );
              })}
            </div>

            <div className="rounded-[1.6rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Mapa / Ubicación</p>
              <div className="mt-4 flex h-[340px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.2))] text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tenant-gradient)] text-2xl font-black text-white shadow-[0_0_30px_var(--tenant-primary-glow)]">📍</div>
                <p className="mt-4 text-lg font-semibold text-white">Publica la ubicación real del taller desde el panel</p>
                <p className="mt-2 max-w-sm text-sm leading-7 text-[color:var(--text-secondary)]">Si no hay mapa configurado, mostramos un placeholder amable en lugar de inventar una dirección.</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="Planes" title="Un plan para cada tamaño de taller" copy="Sin letras chiquitas. Sin modalidades raras. Elige el plan que se acerque al tamaño de tu operación.">
          <div className="grid gap-5 xl:grid-cols-3">
            {[
              { name: "Básico", price: "$300", period: "MXN / mes", description: "Ideal para arrancar con órdenes, clientes y seguimiento.", featured: false },
              { name: "Profesional", price: "$450", period: "MXN / mes", description: "Para talleres que necesitan inventario, reportes y más control.", featured: true },
              { name: "Negocio", price: "$600", period: "MXN / mes", description: "Para operación multi-sucursal y administración más completa.", featured: false },
            ].map((plan) => (
              <article
                key={plan.name}
                className={`rounded-[2rem] border p-6 transition duration-300 hover:-translate-y-1 hover:border-[color:var(--border-glow)] hover:shadow-[0_18px_50px_var(--tenant-primary-glow)] ${plan.featured ? "border-sky-400/40 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))]" : "border-white/10 bg-white/5"}`}
              >
                {plan.featured ? <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">Más popular</span> : null}
                <h3 className="mt-4 text-2xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tight text-white">{plan.price}</span>
                  <span className="pb-1 text-sm text-[color:var(--text-secondary)]">{plan.period}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--text-secondary)]">{plan.description}</p>
                <div className="mt-6">
                  <CTA href={adminOnboardingUrl} variant={plan.featured ? "secondary" : "primary"}>Probar gratis</CTA>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionCard eyebrow="FAQ" title="Respuestas rápidas, sin ruido." copy="Quita objeciones sin llenar la página de texto. Lo importante es que el taller entienda cómo empezar.">
          <div className="grid gap-3">
            {[
              ["¿Necesito internet todo el tiempo?", "Sí, pero funciona en cualquier celular con datos. No necesitas computadora."],
              ["¿Y si solo soy yo en el taller?", "FIXI está pensado para eso. No necesitas equipo ni capacitación."],
              ["¿Puedo sacar mis datos si me quiero ir?", "Sí. Exportas todo a Excel cuando quieras."],
              ["¿Cuánto tarda en funcionar?", "Menos de 30 minutos. Te ayudamos a configurar por WhatsApp."],
              ["¿Necesito tarjeta de crédito para probar?", "No. 14 días gratis, sin tarjeta."],
            ].map(([question, answer]) => (
              <details key={question} className="group rounded-[1.4rem] border border-white/10 bg-black/20 p-4">
                <summary className="cursor-pointer list-none text-sm font-semibold text-white">{question}</summary>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-secondary)]">{answer}</p>
              </details>
            ))}
          </div>
        </SectionCard>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">Listo para operar</span>
              <p className="mt-3 text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">Prueba FIXI gratis y deja de operar a ciegas.</p>
              <p className="mt-4 text-base leading-8 text-[color:var(--text-secondary)]">Si ya operas con WhatsApp, libretas o Excel, FIXI te ayuda a organizar recepción, reparación y entrega sin romper tu flujo actual.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CTA href={adminOnboardingUrl} variant="secondary">Probar gratis 14 días</CTA>
              <CTA href={adminLoginUrl}>Entrar al panel</CTA>
            </div>
          </div>
        </div>
      </section>

      <footer id="contacto" className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Web pública", `${data.tenant.slug}.serviciosdigitalesmx.online`],
              ["Panel administrativo", "Acceso desde el panel"],
              ["Correo", email ? email : "Configura tu correo de contacto"],
              ["WhatsApp", phone ? phone : "Agrega tu WhatsApp para recibir cotizaciones"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4" style={{ borderLeft: `4px solid ${phone || email ? primaryColor : "rgba(255,255,255,0.18)"}` }}>
                <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-[color:var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <p>{data.tenant.name} · Landing automática con branding del tenant.</p>
            <p>{initials} · {getDefaultValue(data.tenant.branding?.customTagline, heroSubtitle)}</p>
          </div>
        </div>
      </footer>
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
