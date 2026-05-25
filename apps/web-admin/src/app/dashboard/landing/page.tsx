"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { fixService } from "@/services/fixService";

type LandingService = {
  title: string;
  description: string;
};

type SocialLink = {
  label: string;
  href: string;
};

type LandingContent = {
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
  services: LandingService[];
  socialLinks: SocialLink[];
  showMap: boolean;
  mapEmbedUrl: string;
  showVideo: boolean;
  videoUrl: string;
};

type TenantLandingSettings = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    contact_phone?: string | null;
    contact_email?: string | null;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    } | null;
    landing_content?: Partial<LandingContent> | null;
  };
};

const emptyService: LandingService = { title: "", description: "" };
const emptySocial: SocialLink = { label: "", href: "" };

const defaultLandingContent: LandingContent = {
  heroTitle: "",
  heroSubtitle: "Landing pública del taller",
  heroDescription: "",
  primaryCtaLabel: "Cotizar ahora",
  primaryCtaHref: "/cotizar",
  secondaryCtaLabel: "Ver estatus",
  secondaryCtaHref: "/tracking",
  contactLabel: "WhatsApp / contacto",
  contactHref: "",
  seoTitle: "",
  seoDescription: "",
  services: [emptyService],
  socialLinks: [emptySocial],
  showMap: false,
  mapEmbedUrl: "",
  showVideo: false,
  videoUrl: "",
};

function normalizeLandingContent(input?: Partial<LandingContent> | null): LandingContent {
  return {
    heroTitle: input?.heroTitle?.trim() ?? defaultLandingContent.heroTitle,
    heroSubtitle: input?.heroSubtitle?.trim() || defaultLandingContent.heroSubtitle,
    heroDescription: input?.heroDescription?.trim() ?? defaultLandingContent.heroDescription,
    primaryCtaLabel: input?.primaryCtaLabel?.trim() || defaultLandingContent.primaryCtaLabel,
    primaryCtaHref: input?.primaryCtaHref?.trim() || defaultLandingContent.primaryCtaHref,
    secondaryCtaLabel: input?.secondaryCtaLabel?.trim() || defaultLandingContent.secondaryCtaLabel,
    secondaryCtaHref: input?.secondaryCtaHref?.trim() || defaultLandingContent.secondaryCtaHref,
    contactLabel: input?.contactLabel?.trim() || defaultLandingContent.contactLabel,
    contactHref: input?.contactHref?.trim() || defaultLandingContent.contactHref,
    seoTitle: input?.seoTitle?.trim() || defaultLandingContent.seoTitle,
    seoDescription: input?.seoDescription?.trim() || defaultLandingContent.seoDescription,
    services: Array.isArray(input?.services) && input?.services.length > 0 ? input.services : [emptyService],
    socialLinks: Array.isArray(input?.socialLinks) && input?.socialLinks.length > 0 ? input.socialLinks : [emptySocial],
    showMap: Boolean(input?.showMap),
    mapEmbedUrl: input?.mapEmbedUrl?.trim() || defaultLandingContent.mapEmbedUrl,
    showVideo: Boolean(input?.showVideo),
    videoUrl: input?.videoUrl?.trim() || defaultLandingContent.videoUrl,
  };
}

function toPublicHref(tenantSlug: string, href: string) {
  if (!href) return "#";
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return href;
  }
  const normalized = href.startsWith("/") ? href : `/${href}`;
  return `/${encodeURIComponent(tenantSlug)}${normalized}`;
}

export default function LandingSettingsPage() {
  const { role, tenantSlug } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState<TenantLandingSettings | null>(null);
  const [landingContent, setLandingContent] = useState<LandingContent>(defaultLandingContent);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const result = await fixService.getTenantLandingSettings();
        if (cancelled) return;
        setSettings(result.data);
        setLandingContent(normalizeLandingContent(result.data.tenant.landing_content ?? null));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar la landing");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const preview = useMemo(() => ({
    primaryHref: toPublicHref(tenantSlug, landingContent.primaryCtaHref),
    secondaryHref: toPublicHref(tenantSlug, landingContent.secondaryCtaHref),
    contactHref: toPublicHref(tenantSlug, landingContent.contactHref),
  }), [landingContent.contactHref, landingContent.primaryCtaHref, landingContent.secondaryCtaHref, tenantSlug]);

  const updateField = <K extends keyof LandingContent>(key: K, value: LandingContent[K]) => {
    setLandingContent((current) => ({ ...current, [key]: value }));
  };

  const updateService = (index: number, key: keyof LandingService, value: string) => {
    setLandingContent((current) => ({
      ...current,
      services: current.services.map((service, idx) => (idx === index ? { ...service, [key]: value } : service)),
    }));
  };

  const updateSocial = (index: number, key: keyof SocialLink, value: string) => {
    setLandingContent((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }));
  };

  const addService = () => setLandingContent((current) => ({ ...current, services: [...current.services, emptyService] }));
  const addSocial = () => setLandingContent((current) => ({ ...current, socialLinks: [...current.socialLinks, emptySocial] }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await fixService.updateTenantLandingSettings({
        branding: settings?.tenant.branding ?? undefined,
        landingContent,
      });

      setSettings(result.data);
      setLandingContent(normalizeLandingContent(result.data.tenant.landing_content ?? null));
      setSuccess("Landing guardada correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar landing");
    } finally {
      setSaving(false);
    }
  };

  const tenantName = settings?.tenant.name ?? tenantSlug;
  const tenantPhone = settings?.tenant.contact_phone ?? null;
  const tenantEmail = settings?.tenant.contact_email ?? null;

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Landing del taller"
        subtitle="Editor por taller usando `tenants.landing_content` como fuente de verdad."
        icon="fas fa-globe"
        actionLabel={saving ? "Guardando..." : "Guardar landing"}
        onAction={handleSave}
        stats={[
          { label: "Taller", value: tenantSlug, helper: "Contenido aislado por taller." },
          { label: "Servicios", value: String(landingContent.services.length), helper: "Bloques visibles en público." },
          { label: "Redes", value: String(landingContent.socialLinks.length), helper: "Contactos públicos del taller." },
        ]}
        columns={[]}
        rows={[]}
        emptyTitle={loading ? "Cargando landing…" : "Editor listo"}
        emptyCopy="La landing pública refleja el branding del taller."
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero título</label>
                <input value={landingContent.heroTitle} onChange={(e) => updateField("heroTitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero subtítulo</label>
                <input value={landingContent.heroSubtitle} onChange={(e) => updateField("heroSubtitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero descripción</label>
                <textarea value={landingContent.heroDescription} onChange={(e) => updateField("heroDescription", e.target.value)} className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">CTA principal</label>
                <input value={landingContent.primaryCtaLabel} onChange={(e) => updateField("primaryCtaLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href principal</label>
                <input value={landingContent.primaryCtaHref} onChange={(e) => updateField("primaryCtaHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">CTA secundario</label>
                <input value={landingContent.secondaryCtaLabel} onChange={(e) => updateField("secondaryCtaLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href secundario</label>
                <input value={landingContent.secondaryCtaHref} onChange={(e) => updateField("secondaryCtaHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Contacto</label>
                <input value={landingContent.contactLabel} onChange={(e) => updateField("contactLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href contacto</label>
                <input value={landingContent.contactHref} onChange={(e) => updateField("contactHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" placeholder={tenantPhone ?? "https://wa.me/..."} />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">SEO título</label>
                <input value={landingContent.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">SEO descripción</label>
                <input value={landingContent.seoDescription} onChange={(e) => updateField("seoDescription", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Servicios</h3>
                <button type="button" onClick={addService} className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100">Agregar servicio</button>
              </div>
              {landingContent.services.map((service, index) => (
                <div key={`${index}-${service.title}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <input value={service.title} onChange={(e) => updateService(index, "title", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" placeholder="Título" />
                  <input value={service.description} onChange={(e) => updateService(index, "description", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" placeholder="Descripción" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Redes y contacto</h3>
                <button type="button" onClick={addSocial} className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-100">Agregar red</button>
              </div>
              {landingContent.socialLinks.map((link, index) => (
                <div key={`${index}-${link.label}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <input value={link.label} onChange={(e) => updateSocial(index, "label", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" placeholder="Etiqueta" />
                  <input value={link.href} onChange={(e) => updateSocial(index, "href", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" placeholder="https://..." />
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm font-medium text-zinc-100">
                <input type="checkbox" checked={landingContent.showMap} onChange={(e) => updateField("showMap", e.target.checked)} />
                Mostrar mapa
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm font-medium text-zinc-100">
                <input type="checkbox" checked={landingContent.showVideo} onChange={(e) => updateField("showVideo", e.target.checked)} />
                Mostrar video
              </label>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Mapa embed URL</label>
                <input value={landingContent.mapEmbedUrl} onChange={(e) => updateField("mapEmbedUrl", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Video URL</label>
                <input value={landingContent.videoUrl} onChange={(e) => updateField("videoUrl", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100" />
              </div>
            </div>

            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
          </section>

          <aside className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_16px_70px_rgba(15,23,42,0.08)]">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#245a82]">Preview público</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{landingContent.heroTitle || tenantName}</h2>
              <p className="mt-2 text-sm text-slate-600">{tenantEmail ?? "Sin correo"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.14),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{landingContent.heroSubtitle}</p>
              <h3 className="mt-3 text-3xl font-bold text-slate-950">{landingContent.heroTitle || tenantName}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{landingContent.heroDescription}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={preview.primaryHref} className="rounded-full bg-[#2c6e9f] px-4 py-2 text-sm font-semibold text-white">{landingContent.primaryCtaLabel}</a>
                <a href={preview.secondaryHref} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">{landingContent.secondaryCtaLabel}</a>
                <a href={preview.contactHref} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">{landingContent.contactLabel}</a>
              </div>
            </div>

            <div className="grid gap-3">
              {landingContent.services.map((service, index) => (
                <div key={`${index}-${service.title}-preview`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold text-slate-950">{service.title || "Servicio"}</div>
                  <div className="text-sm text-slate-600">{service.description || "Descripción"}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-950">SEO título:</span> {landingContent.seoTitle || tenantName}</div>
              <div className="mt-1"><span className="font-semibold text-slate-950">SEO descripción:</span> {landingContent.seoDescription || "Sin descripción"}</div>
            </div>
          </aside>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
