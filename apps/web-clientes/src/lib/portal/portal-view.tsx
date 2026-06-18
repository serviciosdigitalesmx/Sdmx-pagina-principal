"use client";

import { useMemo, useState, useEffect, useCallback, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { getTenantLanding } from "@/lib/api/tenant";
import { getOrderByFolio } from "@/lib/api/orders";
import { normalizeOrderDetail } from "@/lib/utils/normalizers";
import type { NormalizedAttachment, NormalizedDocument, NormalizedOrderDetail, Tenant } from "@/lib/types";
import { TenantBrandingProvider } from "@/lib/theme/tenant-branding-provider";
import { OrderTimeline } from "@/components/portal/order-timeline";
import { EvidenceGallery } from "@/components/portal/evidence-gallery";
import { DocumentList } from "@/components/portal/document-list";

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
      .catch((loadingError) => {
        setTenantError(loadingError instanceof Error ? loadingError.message : "Error al cargar la información del taller.");
      })
      .finally(() => {
        setLoadingTenant(false);
      });
  }, [tenantSlug]);

  const executeSearch = useCallback(
    async (searchValue: string) => {
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
    },
    [tenantSlug],
  );

  useEffect(() => {
    if (!initialFolio) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void executeSearch(initialFolio);
  }, [executeSearch, initialFolio]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await executeSearch(folio);
  };

  const evidenceAttachments: NormalizedAttachment[] = useMemo(() => {
    if (!result) return [];
    return [...result.attachments, ...result.documents]
      .filter((item) => item.url && (item.type === "image" || item.type === "video"))
      .map((item) => ({
        id: item.id,
        name: item.name,
        url: item.url,
        type: item.type === "video" ? "video" : "image",
        mimeType: "application/octet-stream",
        source: "backend",
        date: item.date,
      }));
  }, [result]);

  const evidenceImages = evidenceAttachments.filter((item) => item.type === "image");
  const evidenceVideos = evidenceAttachments.filter((item) => item.type === "video");
  const orderDocuments = useMemo<NormalizedDocument[]>(() => {
    if (!result) return [];
    const documents = [...result.documents];
    if (result.pdfAttachment) {
      documents.unshift(result.pdfAttachment);
    }
    return documents;
  }, [result]);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const generatedPdfHref = result ? `${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenantSlug)}/orders/${encodeURIComponent(result.order.folio)}/pdf` : null;

  if (loadingTenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-50">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-sky-400" />
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/80">Cargando taller...</p>
        </div>
      </main>
    );
  }

  if (tenantError || !tenant) {
    return (
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-white">
                  <span className="text-xl font-black text-sky-600">FX</span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-500">Panel del cliente</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Seguimiento de reparación</h1>
                  <p className="mt-1 text-sm text-slate-500">{tenantSlug}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-[1.5rem] border border-rose-200 bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-lg font-semibold text-slate-900">No se pudo cargar la información del taller.</p>
            <p className="mt-2 text-sm text-slate-500">{tenantError || "El taller especificado no se encuentra registrado en el sistema."}</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <TenantBrandingProvider tenant={tenant}>
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-6 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6">
          <header className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-white">
                  {logoUrl ? (
                    <Image src={logoUrl} alt={tenantLabel} width={56} height={56} className="h-14 w-14 object-contain" />
                  ) : (
                    <span className="text-xl font-black text-sky-600">{tenantLabel.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-sky-500">SRFIX · Seguimiento técnico</p>
                  <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Portal del cliente</h1>
                  <p className="mt-1 text-sm text-slate-500">{tenantLabel}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.22em] text-sky-600">Fecha de hoy</div>
                <div className="mt-1 text-sm font-semibold text-slate-700">{currentDate}</div>
              </div>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Nueva consulta</p>
              <div className="mt-5 rounded-[1.4rem] border border-sky-100 bg-slate-50 p-4">
                <label className="block text-sm font-medium text-slate-700">Folio</label>
                <input
                  value={folio}
                  onChange={(event) => setFolio(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-lg font-semibold tracking-[0.14em] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/30"
                  required
                  placeholder="SRF-00133"
                />
                <p className="mt-2 text-xs text-slate-500">Ingresa el folio de tu orden o el token de acceso.</p>
                {error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
                <button
                  disabled={loading}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:opacity-60"
                >
                  {loading ? "Consultando..." : "Consultar"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-slate-500">
                {["Datos reales", "Tenant aislado", "Documentos", "Timeline"].map((badge) => (
                  <span key={badge} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-4">
                    {badge}
                  </span>
                ))}
              </div>
            </form>

            {result ? (
              <aside className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="space-y-5">
                  <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
                    <div className="text-sm uppercase tracking-[0.2em] text-sky-500">Folio</div>
                    <div className="mt-1 text-3xl font-black tracking-tight text-sky-600">{result.order.folio}</div>
                    <div className="mt-4 text-sm text-slate-600">
                      Estado actual: <span className="font-semibold text-slate-900">{result.orderStatusLabel}</span>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                    <div className="text-sm font-semibold text-sky-600">Información del equipo</div>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-600">Equipo</span>
                        <span className="text-sm font-semibold text-slate-900">{result.order.deviceType}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-600">Marca/Modelo</span>
                        <span className="text-sm font-semibold text-slate-900">{[result.order.deviceBrand, result.order.deviceModel].filter(Boolean).join(" ") || "No disponible"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
                        <span className="text-sm text-slate-600">Falla reportada</span>
                        <span className="text-sm font-semibold text-slate-900 text-right">{result.order.problemDescription}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-slate-600">Fecha de ingreso</span>
                        <span className="text-sm font-semibold text-slate-900">{formatDateOnly(result.order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Fecha promesa</div>
                      <div className="mt-2 text-lg font-bold text-orange-500">{formatDateOnly(result.order.promisedDate ?? null)}</div>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Días restantes</div>
                      <div className="mt-2 text-lg font-bold text-slate-900">
                        {remainingDays === null ? "No disponible" : remainingDays > 0 ? `${remainingDays} días` : `${Math.abs(remainingDays)} días vencidos`}
                      </div>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 sm:col-span-2">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Última actualización</div>
                      <div className="mt-2 text-lg font-bold text-slate-900">{formatDateOnly(result.order.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </aside>
            ) : (
              <aside className="flex min-h-[300px] flex-col items-center justify-center rounded-[1.75rem] border border-sky-100 bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="mb-4 rounded-full border border-sky-200 bg-sky-50 p-4 text-2xl font-black text-sky-600">SR</div>
                <h3 className="text-xl font-black text-slate-900">Seguimiento técnico</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Ingresa el folio para consultar el estado de tu reparación, ver fotografías, documentos y mensajes del taller.
                </p>
              </aside>
            )}
          </section>

          {result ? (
            <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <article className="space-y-6">
                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Seguimiento técnico</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Información del equipo</h2>
                    </div>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
                      {result.orderStatusLabel}
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.4rem] border border-sky-100 bg-sky-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-sky-500">Folio</p>
                      <p className="mt-2 text-2xl font-black tracking-tight text-sky-600">{result.order.folio}</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-sky-100 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Estado actual</p>
                      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{result.orderStatusLabel}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">i</span>
                    <h3 className="text-xl font-black text-sky-600">Información del equipo</h3>
                  </div>
                  <div className="mt-5 divide-y divide-sky-100 overflow-hidden rounded-[1.4rem] border border-sky-100">
                    {[
                      ["Equipo", result.order.deviceType],
                      ["Marca/Modelo", [result.order.deviceBrand, result.order.deviceModel].filter(Boolean).join(" ") || "No disponible"],
                      ["Falla reportada", result.order.problemDescription],
                      ["Fecha de ingreso", formatDateOnly(result.order.createdAt)],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex items-center justify-between gap-4 bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">{label as string}</span>
                        <span className="text-sm font-semibold text-slate-900 text-right">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">📅</span>
                    <h3 className="text-xl font-black text-sky-600">Fechas importantes</h3>
                  </div>
                  <div className="mt-5 divide-y divide-sky-100 overflow-hidden rounded-[1.4rem] border border-sky-100">
                    {[
                      ["Fecha promesa", formatDateOnly(result.order.promisedDate ?? null), "text-orange-500"],
                      ["Días restantes", remainingDays === null ? "No disponible" : remainingDays > 0 ? `${remainingDays} días` : `${Math.abs(remainingDays)} días vencidos`, "text-slate-900"],
                      ["Última actualización", formatDateOnly(result.order.updatedAt), "text-slate-900"],
                    ].map(([label, value, tone]) => (
                      <div key={label as string} className="flex items-center justify-between gap-4 bg-white px-4 py-3">
                        <span className="text-sm text-slate-600">{label as string}</span>
                        <span className={`text-sm font-semibold ${tone as string}`}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">⇄</span>
                    <h3 className="text-xl font-black text-sky-600">Seguimiento</h3>
                  </div>
                  <div className="mt-5 space-y-4">
                    {result.timeline.map((step, index) => {
                      const completed = step.status === "completed";
                      const active = step.status === "in_progress";
                      return (
                        <div key={step.id} className="flex gap-4 rounded-[1.25rem] border border-sky-100 bg-slate-50 p-4">
                          <div className={`mt-1 h-3 w-3 rounded-full ${completed ? "bg-emerald-500" : active ? "bg-sky-500" : "bg-slate-300"}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-slate-900">{step.label}</p>
                              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{index + 1}</span>
                            </div>
                            <p className="mt-1 text-sm leading-6 text-slate-500">{step.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <EvidenceGallery images={evidenceImages} videos={evidenceVideos} />
                <DocumentList documents={orderDocuments} />
              </article>

              <aside className="space-y-4">
                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Acciones</p>
                  <div className="mt-4 space-y-3">
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Contactar por WhatsApp
                      </a>
                    ) : null}
                    {generatedPdfHref ? (
                      <a
                        href={generatedPdfHref}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                      >
                        Imprimir / Guardar PDF
                      </a>
                    ) : null}
                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Visítanos
                      </a>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">Últimos movimientos</p>
                  <div className="mt-4 space-y-3">
                    {(result.messages.length > 0
                      ? result.messages
                      : result.events.map((event) => ({
                          id: event.id,
                          content: event.description,
                          from: event.type,
                          date: event.date,
                          read: true,
                        })))
                      .slice(0, 5)
                      .map((message) => (
                        <div key={message.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="text-sm font-semibold text-slate-900">{message.from ?? "Taller"}</div>
                          <div className="mt-1 text-sm text-slate-600">{message.content}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{formatDate(message.date)}</div>
                        </div>
                      ))}
                  </div>
                </section>
              </aside>
            </section>
          ) : null}

          {hasSearched && !result ? (
            <section className="rounded-[1.75rem] border border-dashed border-sky-200 bg-white p-8 text-center text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <p className="text-lg font-semibold text-slate-900">No encontramos una orden con ese folio</p>
              <p className="mt-2 text-sm">Ingresa un folio válido para ver el estado de tu reparación.</p>
            </section>
          ) : null}

          <footer className="rounded-[1.5rem] border border-sky-100 bg-white p-5 text-sm text-slate-500 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-semibold text-slate-900">{tenantLabel}</div>
                <div>Panel de seguimiento y atención para clientes.</div>
              </div>
              <div className="flex flex-wrap gap-3">
                <span>© {new Date().getFullYear()}</span>
                <span>·</span>
                <Link href="/" className="font-semibold text-sky-600">
                  Privacidad
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </TenantBrandingProvider>
  );
}
