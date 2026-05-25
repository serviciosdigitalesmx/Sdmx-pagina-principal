import Link from "next/link";

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

  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL no está configurada");
  }

  const response = await fetch(`${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenant)}/landing`, {
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as LandingResponse | { error?: string } | null;

  if (!response.ok || !payload || !("success" in payload)) {
    throw new Error((payload && "error" in payload && payload.error) || "No pudimos cargar la landing del tenant");
  }

  return payload.data;
}

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  const data = await getTenantLanding(tenant);
  const landing = data.landingContent;
  const whatsappHref = resolveWhatsappHref(data.tenant.contactPhone ?? data.tenant.contact_phone ?? landing.contactHref ?? undefined);
  const primaryHref = landing.primaryCtaHref.startsWith("http")
    ? landing.primaryCtaHref
    : `/${tenant}${landing.primaryCtaHref.startsWith("/") ? landing.primaryCtaHref : `/${landing.primaryCtaHref}`}`;
  const secondaryHref = landing.secondaryCtaHref.startsWith("http")
    ? landing.secondaryCtaHref
    : `/${tenant}${landing.secondaryCtaHref.startsWith("/") ? landing.secondaryCtaHref : `/${landing.secondaryCtaHref}`}`;

  return (
    <main
      className="min-h-screen text-zinc-50"
      style={{
        background:
          "radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)",
      }}
    >
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-6 text-zinc-50 shadow-[0_30px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Landing pública del taller</p>
              <p className="mt-3 inline-flex rounded-full border border-slate-400/20 bg-slate-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-200">
                {landing.heroSubtitle}
              </p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl [font-family:var(--font-cormorant)]">
                {landing.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 sm:leading-8">{landing.heroDescription}</p>
            </div>
            <div className="grid gap-3 rounded-[1.75rem] border border-zinc-800 bg-zinc-900/80 p-5 sm:grid-cols-2">
              <Link href={primaryHref} className="rounded-2xl bg-slate-500 px-5 py-4 font-semibold text-zinc-950 transition hover:bg-slate-400">
                {landing.primaryCtaLabel}
              </Link>
              <Link href={secondaryHref} className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                {landing.secondaryCtaLabel}
              </Link>
              {whatsappHref ? (
                <a href={whatsappHref} className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                  {landing.contactLabel}
                </a>
              ) : null}
              <Link href={`/t/${tenant}/portal`} className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Portal del cliente
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {landing.services.length > 0 ? landing.services.map((service) => (
            <article key={`${service.title}-${service.description}`} className="rounded-[1.75rem] border border-zinc-800/70 bg-zinc-950/85 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)]">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Servicio</p>
              <h2 className="mt-3 text-2xl font-bold text-zinc-50">{service.title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{service.description}</p>
            </article>
          )) : null}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] lg:grid-cols-[1fr_0.95fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Operación pública</p>
            <h2 className="mt-3 text-3xl font-bold text-zinc-50 [font-family:var(--font-cormorant)]">
              {data.tenant.name} atiende, cotiza y rastrea desde una sola experiencia.
            </h2>
            <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">{landing.seoDescription}</p>
          </div>
          <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">Contacto</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <span className="font-semibold text-zinc-50">Teléfono:</span> {data.tenant.contactPhone ?? data.tenant.contact_phone ?? "Sin teléfono"}
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <span className="font-semibold text-zinc-50">Correo:</span> {data.tenant.contactEmail ?? data.tenant.contact_email ?? "Sin correo"}
              </div>
              {data.tenant.branding?.logoUrl ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                  <span className="font-semibold text-zinc-50">Logo:</span> activo
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section id="contacto" className="grid gap-6 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)] lg:grid-cols-2 lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">Redes y acceso</p>
            <h2 className="mt-3 text-3xl font-bold text-zinc-50 [font-family:var(--font-cormorant)]">
              {data.tenant.name} mantiene la identidad del taller en todos los puntos de entrada.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {landing.socialLinks.map((link) => (
              <a key={`${link.label}-${link.href}`} href={link.href} className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                {link.label}
              </a>
            ))}
            {landing.showMap && landing.mapEmbedUrl ? (
              <a href={landing.mapEmbedUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Abrir mapa
              </a>
            ) : null}
            {landing.showVideo && landing.videoUrl ? (
              <a href={landing.videoUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-zinc-700 px-5 py-4 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Ver video
              </a>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  try {
    const data = await getTenantLanding(tenant);
    return {
      title: data.landingContent.seoTitle || data.tenant.name,
      description: data.landingContent.seoDescription || `Landing pública del taller ${data.tenant.name}.`,
    };
  } catch {
    return {
      title: tenant,
      description: "Landing pública del taller.",
    };
  }
}
