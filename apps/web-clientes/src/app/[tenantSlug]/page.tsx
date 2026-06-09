import { notFound } from "next/navigation";
import { LandingSectionFactory } from "@/lib/landing/landing-section-factory";
import { loadTenantLanding } from "@/lib/landing/tenant-landing-loader";
import { TenantThemeProvider } from "@/lib/theme/tenant-theme-provider";
import { resolveTenantTheme } from "@/lib/theme/theme-resolver";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

function toAbsoluteUrl(value?: string | null) {
  if (!value || !/^https?:\/\//i.test(value)) return null;
  return value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantSlug } = await params;
  const payload = await loadTenantLanding(tenantSlug).catch(() => null);
  const content = payload?.landingContent;
  const tenant = payload?.tenant;
  const theme = tenant ? resolveTenantTheme(tenant) : null;
  const image = toAbsoluteUrl(theme?.imagery.heroImage || theme?.imagery.coverImage || tenant?.branding.logoUrl || null);
  const icon = toAbsoluteUrl(theme?.faviconUrl || tenant?.branding.faviconUrl || null);
  const canonicalPath = `/t/${tenantSlug}`;

  return {
    title: content?.seoTitle || tenant?.name || "Tenant",
    description: content?.seoDescription || `Landing pública del taller ${tenantSlug}.`,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: icon
      ? {
          icon,
          shortcut: icon,
          apple: icon,
        }
      : undefined,
    openGraph: {
      type: "website",
      title: content?.seoTitle || tenant?.name || "Tenant",
      description: content?.seoDescription || `Landing pública del taller ${tenantSlug}.`,
      url: canonicalPath,
      images: image ? [{ url: image, alt: tenant?.name || tenantSlug }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: content?.seoTitle || tenant?.name || "Tenant",
      description: content?.seoDescription || `Landing pública del taller ${tenantSlug}.`,
      images: image ? [image] : undefined,
    },
  };
}

export default async function TenantLandingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  let payload;
  try {
    payload = await loadTenantLanding(tenantSlug);
  } catch {
    notFound();
  }

  if (!payload) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,#08111f_0%,#0f172a_48%,#020617_100%)] px-4 py-8 text-zinc-50">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.35em] text-sky-200/70">Landing pública</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Contenido no disponible</h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300">
            Este tenant todavía no tiene contenido público suficiente para renderizar la landing.
          </p>
        </section>
      </main>
    );
  }

  return (
    <TenantThemeProvider tenantSlug={payload.tenant.slug} theme={resolveTenantTheme(payload.tenant)}>
      <LandingSectionFactory tenant={payload.tenant} landingContent={payload.landingContent} />
    </TenantThemeProvider>
  );
}
