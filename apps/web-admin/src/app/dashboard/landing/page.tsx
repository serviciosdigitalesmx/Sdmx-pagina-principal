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
  availableIndustries?: Array<{
    key: string;
    label: string;
    description: string;
    defaultWorkflowKey: string;
    modules: string[];
  }>;
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
    industry_profile?: {
      industry_key?: string | null;
      industry_label?: string | null;
      asset_label?: string | null;
      order_label?: string | null;
      request_label?: string | null;
      customer_label?: string | null;
      portal_label?: string | null;
      quote_label?: string | null;
      default_workflow_key?: string | null;
      is_active?: boolean | null;
      metadata?: Record<string, unknown> | null;
    } | null;
  };
};

const emptyService: LandingService = { title: "", description: "" };
const emptySocial: SocialLink = { label: "", href: "" };
const DEFAULT_INDUSTRY_KEY = "electronics_repair";

const defaultLandingContent: LandingContent = {
  heroTitle: "Reparación profesional de electrónicos",
  heroSubtitle: "Celulares, computadoras, consolas y tablets",
  heroDescription: "Cotización, seguimiento y contacto directo con marca propia.",
  primaryCtaLabel: "Cotizar ahora",
  primaryCtaHref: "/cotizar",
  secondaryCtaLabel: "Ver estatus",
  secondaryCtaHref: "/tracking",
  contactLabel: "WhatsApp / contacto",
  contactHref: "",
  seoTitle: "Taller de reparación",
  seoDescription: "Landing pública por tenant para talleres de reparación de electrónicos.",
  services: [
    { title: "Celulares", description: "Pantallas, baterías, carga y software." },
    { title: "Computadoras", description: "Laptops, desktops, SSD, memoria y limpieza." },
    { title: "Consolas", description: "Puertos, fuentes, ventilación y controles." },
  ],
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
  const [industryKey, setIndustryKey] = useState<string>(DEFAULT_INDUSTRY_KEY);

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
        setIndustryKey(typeof result.data.tenant.industry_profile?.industry_key === "string" ? result.data.tenant.industry_profile.industry_key : DEFAULT_INDUSTRY_KEY);
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

  const availableIndustries = settings?.availableIndustries ?? [];
  const selectedIndustry = availableIndustries.find((item) => item.key === industryKey) ?? availableIndustries[0] ?? null;

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const result = await fixService.updateTenantLandingSettings({
        branding: settings?.tenant.branding ?? undefined,
        landingContent,
        industryProfile: {
          industry_key: industryKey,
          industry_label: selectedIndustry?.label ?? settings?.tenant.industry_profile?.industry_label ?? null,
          asset_label: settings?.tenant.industry_profile?.asset_label ?? null,
          order_label: settings?.tenant.industry_profile?.order_label ?? null,
          request_label: settings?.tenant.industry_profile?.request_label ?? null,
          customer_label: settings?.tenant.industry_profile?.customer_label ?? null,
          portal_label: settings?.tenant.industry_profile?.portal_label ?? null,
          quote_label: settings?.tenant.industry_profile?.quote_label ?? null,
          default_workflow_key: selectedIndustry?.defaultWorkflowKey ?? settings?.tenant.industry_profile?.default_workflow_key ?? "service_orders",
          is_active: true,
          metadata: {
            source: "dashboard_landing_editor",
          },
        },
      });

      setSettings(result.data);
      setLandingContent(normalizeLandingContent(result.data.tenant.landing_content ?? null));
      setIndustryKey(typeof result.data.tenant.industry_profile?.industry_key === "string" ? result.data.tenant.industry_profile.industry_key : DEFAULT_INDUSTRY_KEY);
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
        title="Integrador del sitio del tenant"
        subtitle="Editor por tenant usando `tenants.branding` y `tenants.landing_content` como fuente de verdad."
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
        emptyTitle={loading ? "Cargando sitio…" : "Editor listo"}
        emptyCopy="El sitio público del tenant refleja su branding, sus colores y su contenido."
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6 rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_70px_rgba(0,0,0,0.24)]">
            <div className="grid gap-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Giro del tenant</label>
                <select
                  value={industryKey}
                  onChange={(e) => setIndustryKey(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20"
                >
                  {availableIndustries.length > 0 ? (
                    availableIndustries.map((industry) => (
                      <option key={industry.key} value={industry.key}>
                        {industry.label}
                      </option>
                    ))
                  ) : (
                    <option value={DEFAULT_INDUSTRY_KEY}>Reparación de electrónicos</option>
                  )}
                </select>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-sm text-zinc-300">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Plantilla activa</p>
                <p className="mt-2 font-semibold text-zinc-50">{selectedIndustry?.label ?? settings?.tenant.industry_profile?.industry_label ?? "Reparación de electrónicos"}</p>
                <p className="mt-1 leading-6 text-zinc-400">{selectedIndustry?.description ?? "Se regeneran módulos, campos, flujos y semáforos desde el backend."}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero título</label>
                <input value={landingContent.heroTitle} onChange={(e) => updateField("heroTitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero subtítulo</label>
                <input value={landingContent.heroSubtitle} onChange={(e) => updateField("heroSubtitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Hero descripción</label>
                <textarea value={landingContent.heroDescription} onChange={(e) => updateField("heroDescription", e.target.value)} className="min-h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">CTA principal</label>
                <input value={landingContent.primaryCtaLabel} onChange={(e) => updateField("primaryCtaLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href principal</label>
                <input value={landingContent.primaryCtaHref} onChange={(e) => updateField("primaryCtaHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">CTA secundario</label>
                <input value={landingContent.secondaryCtaLabel} onChange={(e) => updateField("secondaryCtaLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href secundario</label>
                <input value={landingContent.secondaryCtaHref} onChange={(e) => updateField("secondaryCtaHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Contacto</label>
                <input value={landingContent.contactLabel} onChange={(e) => updateField("contactLabel", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Href contacto</label>
                <input value={landingContent.contactHref} onChange={(e) => updateField("contactHref", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" placeholder={tenantPhone ?? "https://wa.me/..."} />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">SEO título</label>
                <input value={landingContent.seoTitle} onChange={(e) => updateField("seoTitle", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">SEO descripción</label>
                <input value={landingContent.seoDescription} onChange={(e) => updateField("seoDescription", e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1f2937]">Servicios</h3>
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
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1f2937]">Redes y contacto</h3>
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
              <p className="text-xs uppercase tracking-[0.24em] text-[#1f2937]">Preview público</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{landingContent.heroTitle || tenantName}</h2>
              <p className="mt-2 text-sm text-slate-600">{tenantEmail ?? "Sin correo"}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.14),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{landingContent.heroSubtitle}</p>
              <h3 className="mt-3 text-3xl font-bold text-slate-950">{landingContent.heroTitle || tenantName}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{landingContent.heroDescription}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={preview.primaryHref} className="rounded-full bg-[#334155] px-4 py-2 text-sm font-semibold text-white">{landingContent.primaryCtaLabel}</a>
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
