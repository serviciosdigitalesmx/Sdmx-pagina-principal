import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantLanding } from "@/lib/api/tenant";

type PageProps = {
  params: Promise<{ tenantSlug: string }>;
};

function getWhatsappHref(phone?: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export default async function TenantLandingPage({ params }: PageProps) {
  const { tenantSlug } = await params;

  let payload;
  try {
    payload = await getTenantLanding(tenantSlug);
  } catch {
    notFound();
  }

  if (!payload?.success) {
    notFound();
  }

  const { tenant, landingContent } = payload.data;
  const template = tenant.config?.templates?.landing ?? {};
  const heroTitle = template.heroTitle?.trim() || landingContent.heroTitle;
  const heroDescription = template.heroDescription?.trim() || landingContent.heroDescription;
  const primaryCtaLabel = template.primaryCtaLabel?.trim() || landingContent.primaryCtaLabel;
  const primaryCtaHref = template.primaryCtaHref?.trim() || landingContent.primaryCtaHref;
  const secondaryCtaLabel = template.secondaryCtaLabel?.trim() || landingContent.secondaryCtaLabel || "Ver estado";
  const secondaryCtaHref = template.secondaryCtaHref?.trim() || landingContent.secondaryCtaHref || `/${tenantSlug}/portal`;
  const whatsappHref = getWhatsappHref(tenant.contactPhone ?? null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,#08111f_0%,#0f172a_48%,#020617_100%)] px-4 py-6 text-zinc-50">
      <section className="mx-auto w-full max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 text-xl font-black">
                {tenant.branding.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={tenant.branding.logoUrl} alt={tenant.name} className="h-full w-full object-contain" />
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
              <Link href={`/${tenantSlug}/portal`} className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                Ver estado
              </Link>
              <Link href={primaryCtaHref} className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10">
                {primaryCtaLabel}
              </Link>
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20">
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/70">{template.heroSubtitle ?? landingContent.heroSubtitle ?? "Landing del taller"}</p>
            <h2 className="max-w-3xl text-5xl font-black tracking-tight sm:text-7xl">{heroTitle}</h2>
            <p className="max-w-2xl text-lg leading-8 text-zinc-300">{heroDescription}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-sky-400">
                {primaryCtaLabel}
              </Link>
              <Link href={secondaryCtaHref} className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-100 transition hover:bg-white/10">
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">Servicios</p>
            <div className="mt-5 grid gap-4">
              {(landingContent.services ?? []).map((service) => (
                <div key={service.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-zinc-50">{service.title}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">{service.description}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
