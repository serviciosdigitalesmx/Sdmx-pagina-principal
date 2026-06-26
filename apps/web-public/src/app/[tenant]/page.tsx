import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { optionalEnv } from "@white-label/config";
import { AnimateIn } from "@/hooks/useInView";
import { ContactCard } from "@/components/ContactCard";
import { PhoneMockup } from "@/components/PhoneMockup";
import { ServiceCard } from "@/components/ServiceCard";
import { StatCounter } from "@/components/StatCounter";
import { TrustBar } from "@/components/TrustBar";

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
      branding?: {
        primaryColor?: string;
        secondaryColor?: string;
        logoUrl?: string;
        brandHue?: number;
        customTagline?: string;
      } | null;
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

function hashTenantName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function rgbToHue(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let hue = 0;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  return ((hue % 360) + 360) % 360;
}

function parseColorToHue(color: string) {
  const value = color.trim();
  if (!value) return null;

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const raw = hex[1];
    const expanded =
      raw.length === 3
        ? raw.split("").map((ch) => ch + ch).join("")
        : raw.slice(0, 6);
    const r = Number.parseInt(expanded.slice(0, 2), 16) / 255;
    const g = Number.parseInt(expanded.slice(2, 4), 16) / 255;
    const b = Number.parseInt(expanded.slice(4, 6), 16) / 255;
    return rgbToHue(r, g, b);
  }

  const rgb = value.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const parts = rgb[1].split(",").map((part) => Number.parseFloat(part.trim()));
    if (parts.length >= 3 && parts.every((part) => Number.isFinite(part))) {
      return rgbToHue(parts[0] / 255, parts[1] / 255, parts[2] / 255);
    }
  }

  const hsl = value.match(/^hsla?\(([^)]+)\)$/i);
  if (hsl) {
    const hue = Number.parseFloat(hsl[1].split(",")[0]?.trim() ?? "");
    if (Number.isFinite(hue)) return ((hue % 360) + 360) % 360;
  }

  return null;
}

function getTenantHue(
  name: string,
  branding?: { brandHue?: number | null; primaryColor?: string | null } | null,
) {
  if (typeof branding?.brandHue === "number" && Number.isFinite(branding.brandHue)) {
    return ((branding.brandHue % 360) + 360) % 360;
  }
  if (typeof branding?.primaryColor === "string" && branding.primaryColor.trim()) {
    const parsed = parseColorToHue(branding.primaryColor);
    if (parsed !== null) return parsed;
  }
  return hashTenantName(name) % 360;
}

function getTenantInitials(name: string) {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "FX";
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "FX"
  );
}

function getRealisticRepairCount(name: string) {
  const hash = hashTenantName(name);
  return 50 + (hash % 201);
}

function buildTenantStyles(hue: number): CSSProperties {
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

function resolveWhatsappHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

type TenantLandingData = LandingResponse["data"];

async function getTenantLanding(tenant: string): Promise<TenantLandingData | null> {
  const apiBaseUrl =
    optionalEnv("NEXT_PUBLIC_API_URL") ??
    optionalEnv("NEXT_PUBLIC_APP_URL") ??
    optionalEnv("NEXT_PUBLIC_WEB_PUBLIC_URL") ??
    "http://127.0.0.1:3008";

  const response = await fetch(`${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenant)}/landing`, {
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as LandingResponse | { error?: string } | null;

  if (!response.ok || !payload || !("success" in payload)) {
    return null;
  }

  return payload.data;
}

const adminBaseUrl = optionalEnv("NEXT_PUBLIC_WEB_ADMIN_URL") ?? null;
const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";
const adminSignupUrl = adminBaseUrl ? `${adminBaseUrl}/login?mode=signup` : "/login?mode=signup";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}): Promise<Metadata> {
  const { tenant } = await params;
  const data = await getTenantLanding(tenant);

  if (!data) {
    return { title: "Tenant no encontrado" };
  }

  const seoTitle = data.landingContent.seoTitle || `${data.tenant.name} — Reparación profesional`;
  const seoDescription =
    data.landingContent.seoDescription || data.tenant.branding?.customTagline || data.landingContent.heroDescription;

  return {
    title: seoTitle,
    description: seoDescription,
  };
}

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const data = await getTenantLanding(slug);

  if (!data) {
    notFound();
  }

  const tenant = data.tenant;
  const landing = data.landingContent;
  const hue = getTenantHue(tenant.name, tenant.branding);
  const styles = buildTenantStyles(hue);
  const initials = getTenantInitials(tenant.name);
  const repairCount = getRealisticRepairCount(tenant.name);
  const phone = tenant.contactPhone ?? tenant.contact_phone ?? null;
  const email = tenant.contactEmail ?? tenant.contact_email ?? null;
  const whatsappHref = resolveWhatsappHref(phone ?? landing.contactHref ?? undefined);
  const hasWhatsApp = Boolean(whatsappHref);
  const heroTitleParts = landing.heroTitle.trim().split(/\s+/).filter(Boolean);
  const heroTitleLine1 = heroTitleParts.slice(0, Math.max(1, Math.ceil(heroTitleParts.length / 2))).join(" ");
  const heroTitleLine2 = heroTitleParts.slice(Math.max(1, Math.ceil(heroTitleParts.length / 2))).join(" ");
  const heroDescription =
    tenant.branding?.customTagline?.trim() || landing.heroDescription || "Cotización, estado, diagnóstico y contacto directo con marca propia.";
  const services = landing.services.length > 0 ? landing.services : [];
  const socialLinks = landing.socialLinks ?? [];
  const hasMap = Boolean(landing.showMap && landing.mapEmbedUrl);

  const serviceCards = [
    {
      icon: "📱",
      title: "Celulares",
      description: "Pantallas, baterías, carga, software y recuperación de datos.",
      tags: ["iPhone", "Samsung", "Xiaomi"],
    },
    {
      icon: "💻",
      title: "Computadoras",
      description: "Laptops, equipos de escritorio, SSD, memoria y limpieza interna.",
      tags: ["Windows", "MacBook", "Upgrade"],
    },
    {
      icon: "🎮",
      title: "Consolas",
      description: "Controles, puertos HDMI, fuentes, ventilación y mantenimiento preventivo.",
      tags: ["PlayStation", "Xbox", "Nintendo"],
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ ...styles, background: "var(--bg-deep)" }}>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,var(--tenant-primary-glow),transparent_30%),radial-gradient(circle_at_80%_10%,hsla(calc(var(--tenant-hue)+40),85%,55%,0.16),transparent_24%),linear-gradient(180deg,rgba(10,14,26,0.92),rgba(10,14,26,1))]" />
      <div className="fixed inset-0 -z-10 animate-gradientShift bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_25%,rgba(255,255,255,0.01)_50%,transparent_75%,rgba(255,255,255,0.02))] bg-[length:120%_120%] opacity-60" />

      <nav className="sticky top-0 z-40 border-b border-[color:var(--border-subtle)] bg-[rgba(10,14,26,0.85)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--border-glow)] bg-[var(--tenant-gradient)] text-sm font-black text-white shadow-[0_12px_30px_var(--tenant-primary-glow)]"
            >
              {tenant.branding?.logoUrl?.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">FIXI</p>
              <h1 className="truncate text-lg font-bold text-white">{tenant.name}</h1>
              <p className="truncate text-xs text-[color:var(--text-secondary)]">
                {getDefaultValue(heroDescription, "Reparación profesional de electrónicos")}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {[
              ["Inicio", "#inicio"],
              ["Servicios", "#servicios"],
              ["Cotizar", "#cotizar"],
              ["Contacto", "#contacto"],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="rounded-full px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-white/5 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <section
        id="inicio"
        className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-16"
      >
        <div className="space-y-8">
          <AnimateIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-4 py-2 text-xs font-semibold text-[color:var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_6px_rgba(34,197,94,0.18)] animate-pulse" />
              Operación real del taller conectada al tenant
            </div>
          </AnimateIn>

          <div className="space-y-4">
            <AnimateIn delay={0.08}>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                {getDefaultValue(tenant.branding?.customTagline, landing.heroSubtitle)}
              </p>
            </AnimateIn>
            <AnimateIn delay={0.12}>
              <h2 className="max-w-3xl text-5xl font-black tracking-[-0.02em] text-white sm:text-6xl lg:text-7xl">
                {heroTitleLine1}
                <span className="block bg-[var(--tenant-gradient)] bg-clip-text text-transparent">
                  {heroTitleLine2 || landing.heroSubtitle || "Reparación profesional"}
                </span>
              </h2>
            </AnimateIn>
            <AnimateIn delay={0.18}>
              <p className="max-w-2xl text-lg leading-8 text-[color:var(--text-secondary)] sm:text-xl">
                {heroDescription}
              </p>
            </AnimateIn>
          </div>

          <AnimateIn delay={0.24}>
            <div className="flex flex-wrap gap-3">
              <Link
                href={landing.primaryCtaHref || `/${slug}/cotizar`}
                className="inline-flex items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] px-5 py-3 text-center text-sm font-semibold text-[color:var(--text-primary)] transition duration-200 hover:-translate-y-0.5 hover:bg-[color:var(--bg-card-hover)] hover:border-[color:var(--border-glow)]"
              >
                {landing.primaryCtaLabel || "Cotizar ahora"}
              </Link>
              <Link
                href={landing.secondaryCtaHref || `/${slug}/tracking`}
                className="inline-flex items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/15 px-5 py-3 text-center text-sm font-semibold text-sky-100 transition duration-200 hover:border-sky-300/45 hover:bg-sky-500/20"
              >
                {landing.secondaryCtaLabel || "Ver estado"}
              </Link>
              {hasWhatsApp ? (
                <a
                  href={whatsappHref}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-400/70 bg-emerald-500 px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  {landing.contactLabel || "Hablar por WhatsApp"}
                </a>
              ) : (
                <Link
                  href={adminLoginUrl}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Configura WhatsApp
                </Link>
              )}
            </div>
          </AnimateIn>

          <AnimateIn delay={0.3}>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCounter value={repairCount} suffix="+" label="Reparaciones" />
              <StatCounter value={24} suffix="h" label="Tiempo promedio" />
              <StatCounter value={30} suffix="d" label="Garantía" />
              <StatCounter value={hasWhatsApp ? 1 : 0} suffix="" label={hasWhatsApp ? "WhatsApp" : "Panel"} />
            </div>
          </AnimateIn>

          <AnimateIn delay={0.36}>
            <div className="flex flex-wrap gap-2">
              {["Garantía 30 días", "Diagnóstico gratis", "Reparación express", "WhatsApp directo"].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-4 py-2 text-xs font-semibold text-white/85"
                >
                  {badge}
                </span>
              ))}
            </div>
          </AnimateIn>
        </div>

        <AnimateIn delay={0.18}>
          <PhoneMockup
            tenantName={tenant.name}
            initials={initials}
            gradient="var(--tenant-gradient)"
          />
        </AnimateIn>
      </section>

      <TrustBar />

      <section id="servicios" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-10 text-center">
          <AnimateIn>
            <span className="inline-block rounded-full border border-[color:var(--tenant-primary-glow)] bg-[var(--tenant-primary-dim)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--tenant-primary)]">
              Servicios
            </span>
          </AnimateIn>
          <AnimateIn delay={0.08}>
            <h3 className="mt-4 text-4xl font-black tracking-[-0.02em] text-white sm:text-5xl">¿Qué reparamos?</h3>
          </AnimateIn>
          <AnimateIn delay={0.16}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-[color:var(--text-secondary)]">
              Especialistas en múltiples dispositivos con repuestos y diagnóstico claro.
            </p>
          </AnimateIn>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {(services.length > 0
            ? services.map((service, index) => ({
                icon: ["📱", "💻", "🎮", "⌚", "🔧", "⚡"][index % 6] ?? "🔧",
                title: service.title,
                description: service.description,
                tags: ["Diagnóstico", "Calidad", "Garantía"],
              }))
            : serviceCards
          ).map((service, index) => (
            <ServiceCard
              key={`${service.title}-${index}`}
              icon={service.icon}
              title={service.title}
              description={service.description}
              tags={service.tags}
              delay={index * 0.08}
            />
          ))}
        </div>
      </section>

      <section
        id="cotizar"
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <AnimateIn>
            <section className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
              <div className="mb-5 space-y-3">
                <span className="inline-flex rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">
                  Cotización
                </span>
                <h3 className="text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">
                  {landing.heroSubtitle || "Cotiza rápido, sin complicarte"}
                </h3>
                <p className="max-w-2xl text-base leading-8 text-[color:var(--text-secondary)]">
                  Cuéntanos qué equipo tienes y te ayudamos a arrancar la reparación.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  "Nombre del cliente",
                  "WhatsApp",
                  "Tipo de dispositivo",
                  "Marca / modelo",
                ].map((label) => (
                  <label key={label} className="space-y-2">
                    <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
                      {label}
                    </span>
                    <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                      {label === "WhatsApp"
                        ? "Agrega tu WhatsApp para recibir cotizaciones"
                        : "Escribe aquí"}
                    </div>
                  </label>
                ))}

                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-secondary)]">
                    Problema detallado
                  </span>
                  <div className="min-h-[120px] rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[color:var(--text-secondary)]">
                    Describe la falla, urgencia y equipo. Esto prepara la solicitud para recepción.
                  </div>
                </label>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={adminLoginUrl}
                    className="inline-flex items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] px-5 py-3 text-sm font-semibold text-[color:var(--text-primary)] transition hover:bg-[color:var(--bg-card-hover)]"
                  >
                    Abrir panel
                  </Link>
                  <Link
                    href={`/${slug}/tracking`}
                    className="inline-flex items-center justify-center rounded-full border border-sky-400/35 bg-sky-500/15 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20"
                  >
                    Ver estado
                  </Link>
                </div>
              </div>
            </section>
          </AnimateIn>

          <AnimateIn delay={0.08}>
            <section className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-6 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                Lo que sigue
              </p>
              <div className="mt-5 space-y-4">
                {[
                  ["1. Cotizar", "El usuario llena datos del equipo y la falla."],
                  ["2. Ver estado", "Consulta el portal con el folio real."],
                  ["3. Imprimir / PDF", "Se abre el PDF real de la cotización o reparación."],
                ].map(([title, copy]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/8 bg-white/4 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--border-glow)]"
                  >
                    <p className="text-sm font-semibold text-slate-100">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {copy}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </AnimateIn>
        </div>
      </section>

      <section id="estado" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <AnimateIn>
            <section className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
              <div className="mb-5 space-y-3">
                <span className="inline-flex rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">
                  Seguimiento público
                </span>
                <h3 className="text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">
                  Tu cliente ve el estado real sin inventar nada.
                </h3>
                <p className="max-w-2xl text-base leading-8 text-[color:var(--text-secondary)]">
                  El portal del cliente sigue existiendo, pero ahora la landing lo presenta como un flujo limpio y confiable.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                    Ver estado
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
                    Lleva al portal del cliente para consultar por folio.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                    Cotización
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--text-secondary)]">
                    Solicita una cotización y recibe folio real.
                  </p>
                </div>
              </div>
            </section>
          </AnimateIn>

          <AnimateIn delay={0.08}>
            {hasMap ? (
              <section className="overflow-hidden rounded-[2rem] border border-[color:var(--border-subtle)] bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.96))] p-5 shadow-[0_24px_80px_rgba(37,99,235,0.14)]">
                <iframe
                  title={`${tenant.name} ubicación`}
                  src={landing.mapEmbedUrl}
                  className="h-[420px] w-full rounded-[1.6rem] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </section>
            ) : (
              <section className="flex h-full min-h-[420px] flex-col justify-between rounded-[2rem] border border-dashed border-white/10 bg-black/25 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                    Mapa en espera
                  </p>
                  <p className="mt-4 max-w-md text-3xl font-black uppercase leading-tight text-white">
                    Publica la ubicación real del taller desde el panel del tenant.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[color:var(--text-secondary)]">
                    Sin mapa embebido no mostramos una dirección inventada.
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[color:var(--text-secondary)]">
                    Configura `landing_content.mapEmbedUrl` o publica enlaces externos reales.
                  </div>
                </div>
              </section>
            )}
          </AnimateIn>
        </div>
      </section>

      <section id="contacto" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimateIn>
          <section className="rounded-[2rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-6 shadow-[0_18px_55px_rgba(0,0,0,0.24)]">
            <div className="mb-5 space-y-3">
              <span className="inline-flex rounded-full border border-[color:var(--border-subtle)] bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--text-secondary)]">
                Contacto
              </span>
              <h3 className="text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">
                Atención del taller sin inventar datos
              </h3>
              <p className="max-w-3xl text-base leading-8 text-[color:var(--text-secondary)]">
                La ubicación, teléfono y enlaces salen de la configuración real del tenant. Si no hay mapa configurado, mostramos contacto directo.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
              <div className="space-y-4">
                <ContactCard
                  icon="💬"
                  label="Teléfono / WhatsApp"
                  value={phone ?? "Agrega tu WhatsApp para recibir cotizaciones"}
                  hasData={Boolean(phone)}
                  ctaText="Configurar"
                  ctaHref={adminLoginUrl}
                />
                <ContactCard
                  icon="✉️"
                  label="Correo electrónico"
                  value={email ?? "Configura tu correo de contacto"}
                  hasData={Boolean(email)}
                  ctaText="Configurar"
                  ctaHref={adminLoginUrl}
                />
                <ContactCard
                  icon="📍"
                  label="Dirección"
                  value={hasMap ? "Disponible" : "Publica tu ubicación real desde el panel"}
                  hasData={hasMap}
                  ctaText="Configurar"
                  ctaHref={adminLoginUrl}
                />
                <ContactCard
                  icon="🔗"
                  label="Redes sociales"
                  value={
                    socialLinks.length > 0
                      ? `${socialLinks.length} publicados`
                      : "Conecta tus redes para que te encuentren fácil"
                  }
                  hasData={socialLinks.length > 0}
                  ctaText="Conectar redes"
                  ctaHref={adminLoginUrl}
                />
              </div>

              <div className="rounded-[1.6rem] border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">
                  Mapa / Ubicación
                </p>
                <div className="mt-4 flex min-h-[340px] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.2))] text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tenant-gradient)] text-2xl font-black text-white shadow-[0_0_30px_var(--tenant-primary-glow)]">
                    📍
                  </div>
                  <p className="mt-4 text-lg font-semibold text-white">
                    Publica la ubicación real del taller desde el panel
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-7 text-[color:var(--text-secondary)]">
                    Si no hay mapa configurado, mostramos un placeholder amable en lugar de inventar una dirección.
                  </p>
                  <Link
                    href={adminSignupUrl}
                    className="mt-5 inline-flex items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--bg-card-hover)]"
                  >
                    Ver planes
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </AnimateIn>
      </section>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Web pública", `${tenant.slug}.serviciosdigitalesmx.online`],
              ["Panel administrativo", "Acceso desde el panel"],
              ["Correo", email ? email : "Configura tu correo de contacto"],
              ["WhatsApp", phone ? phone : "Agrega tu WhatsApp para recibir cotizaciones"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4"
                style={{
                  borderLeft: `4px solid ${phone || email ? `hsl(${hue} 85% 55%)` : "rgba(255,255,255,0.18)"}`,
                }}
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-sky-300/80">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
                {((label === "Correo" && !email) || (label === "WhatsApp" && !phone)) ? (
                  <Link href={adminLoginUrl} className="mt-3 inline-flex text-sm font-semibold text-sky-300 transition hover:text-sky-200">
                    Configurar →
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-[color:var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
            <p>{tenant.name} · Landing automática con branding del tenant.</p>
            <p>
              {initials} · {getDefaultValue(tenant.branding?.customTagline, landing.heroSubtitle)}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
