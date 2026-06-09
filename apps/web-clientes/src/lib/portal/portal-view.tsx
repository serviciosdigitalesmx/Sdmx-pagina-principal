"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTenantLanding } from "@/lib/api/tenant";
import { getOrderByFolio } from "@/lib/api/orders";
import { normalizeOrderDetail } from "@/lib/utils/normalizers";
import type { NormalizedOrderDetail, Tenant } from "@/lib/types";
import { TenantThemeProvider } from "@/lib/theme/tenant-theme-provider";
import { resolveTenantTheme } from "@/lib/theme/theme-resolver";

function resolveWhatsappHref(phone?: string | null, folio?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  const text = encodeURIComponent(`Hola, quiero consultar mi folio ${folio ?? ""}.`);
  return `https://wa.me/${digits}?text=${text}`;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "No disponible";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : date.toLocaleString("es-MX");
}

function formatDateOnly(value?: string | Date | null) {
  if (!value) return "No disponible";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : date.toLocaleDateString("es-MX");
}

function daysRemaining(promisedDate?: string | Date | null) {
  if (!promisedDate) return null;
  const end = promisedDate instanceof Date ? promisedDate : new Date(promisedDate);
  if (Number.isNaN(end.getTime())) return null;
  const diff = end.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type PortalViewProps = {
  tenantSlug: string;
  initialFolio?: string;
};

export function PortalView({ tenantSlug, initialFolio = "" }: PortalViewProps) {
  const [folio, setFolio] = useState(initialFolio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedOrderDetail | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [galleryImage, setGalleryImage] = useState<string | null>(null);
  const [tenantLabel, setTenantLabel] = useState<string>(tenantSlug || "Tenant");
  const [loadingTenant, setLoadingTenant] = useState(Boolean(tenantSlug));
  const [tenantError, setTenantError] = useState<string | null>(tenantSlug ? null : "El slug del taller es requerido.");
  const [hasSearched, setHasSearched] = useState(false);

  const portalContent = tenant?.config?.templates?.portal ?? {};
  const logoUrl = tenant?.branding?.logoUrl ?? null;
  const contactPhone = tenant?.contactPhone ?? null;
  const whatsappHref = useMemo(() => resolveWhatsappHref(contactPhone, result?.order.folio), [contactPhone, result?.order.folio]);
  const currentDate = useMemo(() => new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), []);
  const remainingDays = daysRemaining(result?.order.promisedDate ?? null);
  const hasLiveCam = Boolean((portalContent as Record<string, unknown>).showVideo || (tenant?.config?.templates?.landing as Record<string, unknown> | undefined)?.showVideo);
  const liveCamUrl = String((portalContent as Record<string, unknown>).videoUrl ?? (tenant?.config?.templates?.landing as Record<string, unknown> | undefined)?.videoUrl ?? "");
  const mapUrl = String((tenant?.config?.templates?.landing as Record<string, unknown> | undefined)?.mapEmbedUrl ?? "");

  useEffect(() => {
    if (!tenantSlug) return;

    getTenantLanding(tenantSlug)
      .then((payload) => {
        if (!payload.success) throw new Error("Respuesta inválida del servidor");
        setTenant(payload.data.tenant);
        setTenantLabel(payload.data.tenant.name || tenantSlug);
      })
      .catch((error) => {
        setTenantError(error instanceof Error ? error.message : "Error al cargar la información del taller.");
      })
      .finally(() => {
        setLoadingTenant(false);
      });
  }, [tenantSlug]);

  const executeSearch = useCallback(async (searchValue: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      if (!tenantSlug) throw new Error("Tenant slug ausente en la ruta");
      if (!searchValue.trim()) throw new Error("Ingresa tu folio o token");

      const payload = await getOrderByFolio(tenantSlug, searchValue.trim());
      if (!payload.success) throw new Error("No encontramos una orden con ese folio");

      setTenantLabel(payload.tenant.name || tenantSlug);
      setTenant(payload.tenant);
      setResult(normalizeOrderDetail(payload.data));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (!initialFolio) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void executeSearch(initialFolio);
  }, [executeSearch, initialFolio]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await executeSearch(folio);
  };

  const orderImages = useMemo(
    () => [...(result?.attachments ?? []), ...(result?.documents ?? [])].filter((item) => item.url && (item.type === "image" || item.type === "video")),
    [result?.attachments, result?.documents]
  );

  if (loadingTenant) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#ffffff_100%)] flex items-center justify-center text-slate-950 p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold tracking-wide text-slate-600 uppercase">Cargando taller...</p>
        </div>
      </main>
    );
  }

  if (tenantError || !tenant) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.16),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#ffffff_100%)] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <span className="text-2xl font-bold text-slate-600">FX</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Seguimiento técnico</p>
                  <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">Portal del cliente</h1>
                  <p className="mt-2 text-sm text-slate-600">{tenantSlug}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Fecha de hoy</div>
                <div className="mt-1 text-lg font-semibold text-slate-950">{currentDate}</div>
              </div>
            </div>
          </header>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold text-slate-950">No se pudo cargar la información del taller.</p>
            <p className="mt-2 text-sm">{tenantError || "El taller especificado no se encuentra registrado en el sistema."}</p>
          </section>

          <footer className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-slate-900">Servicios Digitales MX</div>
                <div>Plataforma de seguimiento y atención para talleres.</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>Derechos reservados</span>
                <span>·</span>
                <Link href="/" className="font-semibold text-slate-900">Privacidad</Link>
              </div>
            </div>
          </footer>
        </div>
      </main>
    );
  }

  return (
    <TenantThemeProvider tenantSlug={tenant.slug} theme={resolveTenantTheme(tenant)}>
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.16),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#ffffff_100%)] px-4 py-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {logoUrl ? (
                  <Image src={logoUrl} alt={tenantLabel} width={64} height={64} className="h-16 w-16 object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-slate-600">{tenantLabel.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Seguimiento técnico</p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">Portal del cliente</h1>
                <p className="mt-2 text-sm text-slate-600">{tenantLabel}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-right">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Fecha de hoy</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">{currentDate}</div>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1f2937]">Busca tu orden</p>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">Folio o token</label>
              <input
                value={folio}
                onChange={(event) => setFolio(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#334155] focus:ring-2 focus:ring-[#334155]/20"
                required
              />
              <p className="mt-2 text-xs text-slate-500">Ingresa el folio de tu orden de servicio o el token de acceso.</p>
            </div>
            {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button disabled={loading} className="rounded-full bg-[#334155] px-6 py-3 font-semibold text-white transition hover:bg-[#1f2937] disabled:opacity-60">
                {loading ? "Consultando..." : "Buscar orden"}
              </button>
              <p className="text-sm leading-6 text-slate-600">La consulta solo muestra datos de tu taller.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Actualización diaria", "Datos seguros", "Contacto directo", "Live cam disponible"].map((badge) => (
                <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  {badge}
                </span>
              ))}
            </div>
          </form>

          {result ? (
            <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Folio consultado", result.order.folio ?? "No disponible"],
                  ["Estado actual", result.order.statusLabel ?? result.orderStatusLabel ?? "No disponible"],
                  ["Tipo de equipo", result.order.deviceType ?? "No disponible"],
                  ["Marca y modelo", [result.order.deviceBrand, result.order.deviceModel].filter(Boolean).join(" ") || "No disponible"],
                  ["Falla reportada", result.order.problemDescription ?? "No disponible"],
                  ["Fecha de ingreso", formatDate(result.order.createdAt)],
                  ["Fecha promesa", formatDateOnly(result.order.promisedDate ?? null)],
                  ["Días restantes", remainingDays === null ? "No disponible" : remainingDays > 0 ? `${remainingDays} días` : `${Math.abs(remainingDays)} días vencidos`],
                  ["Última actualización", formatDate(result.order.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label as string}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-950">{String(value)}</div>
                  </div>
                ))}
              </div>
            </aside>
          ) : (
            <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)] flex flex-col items-center justify-center text-center py-12 min-h-[300px]">
              <div className="rounded-full bg-slate-50 p-4 border border-slate-100 mb-4 text-[#334155] text-2xl font-bold">🔍</div>
              <h3 className="text-xl font-bold text-slate-950">Consulta tu reparación</h3>
              <p className="mt-2 text-sm text-slate-600 max-w-sm leading-6">
                Ingresa el folio o token de tu orden en el formulario para consultar el estatus en tiempo real, ver avances, fotografías y documentos.
              </p>
            </aside>
          )}
        </section>

        {result && (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1f2937]">Seguimiento detallado</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">Avances técnicos</h2>
                </div>
                <span className="rounded-full bg-[#475569]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#475569]">
                  {result.orderStatusLabel}
                </span>
              </div>

              <div className="mt-6 space-y-4">
                {result.timeline.map((step) => (
                  <div key={step.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-950">{step.label}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">{step.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{step.note}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1f2937]">Fotografías de avance</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Haz clic para ampliar</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {orderImages.length > 0 ? (
                    orderImages.map((item) => {
                      const imageUrl = item.url;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGalleryImage(imageUrl)}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left"
                        >
                          {imageUrl ? (
                            <Image src={imageUrl} alt={item.name || "Evidencia"} width={800} height={600} className="h-48 w-full object-cover" />
                          ) : null}
                          <div className="p-4">
                            <div className="text-sm font-semibold text-slate-950">{item.name || "Adjunto"}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{item.type ?? "evidencia"}</div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500 sm:col-span-2">
                      Aún no hay fotografías registradas.
                    </div>
                  )}
                </div>
              </div>
            </article>

            <aside className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acciones del cliente</p>
                <div className="mt-4 flex flex-col gap-3">
                  {whatsappHref ? (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-500 px-4 py-3 text-center font-semibold text-white transition hover:bg-emerald-600">
                      WhatsApp
                    </a>
                  ) : null}
                  {result.pdfAttachment?.url || result.documents.length > 0 ? (
                    <div className="space-y-3">
                      {(result.documents.length > 0
                        ? result.documents.map((doc) => ({
                            key: doc.id,
                            url: doc.url ?? "",
                            label: doc.name,
                          }))
                        : result.pdfAttachment
                          ? [{ key: "pdf", url: result.pdfAttachment.url, label: result.pdfAttachment.name }]
                          : []
                      ).map((doc) => {
                        if (!doc.url) return null;
                        return (
                          <a
                            key={doc.key}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-full border border-slate-300 bg-white px-4 py-3 text-center font-semibold text-slate-800 transition hover:bg-slate-50"
                          >
                            {doc.label ?? "Ver documento"}
                          </a>
                        );
                      })}
                    </div>
                  ) : null}
                  {mapUrl ? (
                    <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 bg-white px-4 py-3 text-center font-semibold text-slate-800 transition hover:bg-slate-50">
                      Visitar sucursal
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Live Cam</p>
                {hasLiveCam && liveCamUrl ? (
                  <a href={liveCamUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                    Abrir transmisión en vivo
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No está habilitada para este taller.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Últimos movimientos</p>
                <div className="mt-3 space-y-3">
                  {(result.messages.length > 0 ? result.messages : result.events.map((event) => ({
                    id: event.id,
                    content: event.description,
                    from: event.type,
                    date: event.date,
                    read: true
                  }))).slice(0, 5).map((message) => (
                    <div key={message.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-sm font-semibold text-slate-950">{message.from ?? "Taller"}</div>
                      <div className="mt-1 text-sm text-zinc-600">{message.content}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{formatDate(message.date)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>
        )}

        {hasSearched && !result && (
          <section className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
            <p className="text-lg font-semibold text-slate-950">No encontramos una orden con ese folio</p>
            <p className="mt-2 text-sm">Ingresa un folio válido para ver el estado de tu reparación.</p>
          </section>
        )}

        <footer className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-[0_12px_50px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-slate-900">Servicios Digitales MX</div>
              <div>Plataforma de seguimiento y atención para talleres.</div>
            </div>
            <div className="flex flex-wrap gap-3">
              <span>Derechos reservados</span>
              <span>·</span>
              <Link href="/" className="font-semibold text-slate-900">Privacidad</Link>
            </div>
          </div>
        </footer>
      </div>

      {galleryImage ? (
        <button
          type="button"
          onClick={() => setGalleryImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8"
        >
          <div className="max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <Image src={galleryImage} alt="Fotografía ampliada" width={1400} height={1000} className="h-auto w-full object-contain" />
          </div>
        </button>
      ) : null}
    </main>
    </TenantThemeProvider>
  );
}
