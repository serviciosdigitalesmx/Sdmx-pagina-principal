"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { optionalEnv } from "@white-label/config";
import { getPublicApiPath } from "@/lib/public-api";

type PortalOrderResponse = {
  success: true;
  tenant: {
    id: string;
    slug: string;
    name: string;
    contact_phone?: string | null;
    contact_email?: string | null;
    config?: {
      labels?: Record<string, string>;
      templates?: {
        portal?: Record<string, unknown>;
      };
    } | null;
  };
  data: {
    order: {
      folio: string;
      status: string;
      final_cost?: number | null;
      created_at?: string;
      device_info?: {
        customer_name?: string;
        customer_phone?: string;
        customer_email?: string;
        brand?: string;
        model?: string;
        type?: string;
      };
      problem_description?: string;
      serial_number?: string;
      receipt_url?: string | null;
    };
    orderStatusLabel: string;
    timeline: Array<{ label: string; status: "completado" | "actual" | "pendiente"; note: string }>;
    pdf_attachment: {
      type: "receipt_pdf";
      label: string;
      url: string;
      fileName: string | null;
      mimeType: string;
      source: "stored_url" | "inline_data_url";
    } | null;
    attachments: Array<{
      type: "receipt_pdf";
      label: string;
      url: string;
      fileName: string | null;
      mimeType: string;
      source: "stored_url" | "inline_data_url";
    }>;
    documents: Array<{
      id: string;
      file_name: string;
      file_type: string;
      public_url: string | null;
      mime_type: string;
      created_at: string;
      source: string;
    }>;
    events: Array<{
      id: string;
      event_type: string;
      previous_status: string | null;
      new_status: string | null;
      note: string | null;
      actor_name: string | null;
      created_at: string;
    }>;
    messages: Array<{
      id: string;
      note: string | null;
      actor_name: string | null;
      created_at: string;
    }>;
  };
};

function resolveWhatsappHref(phone?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

function resolveContactWhatsapp(tenant?: PortalOrderResponse["tenant"] | null, portalTemplate?: Record<string, unknown> | null) {
  const templateContactHref = portalTemplate && typeof (portalTemplate as { contactHref?: unknown }).contactHref === "string"
    ? String((portalTemplate as { contactHref?: unknown }).contactHref)
    : "";
  const contactPhone = tenant?.contact_phone ?? "";
  const envPhone = optionalEnv("NEXT_PUBLIC_SAAS_CONTACT_PHONE") ?? "";

  const candidates = [templateContactHref, contactPhone, envPhone];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = candidate.startsWith("https://wa.me/")
      ? candidate
      : resolveWhatsappHref(candidate);
    if (resolved) return resolved;
  }

  return undefined;
}

export default function PortalPage() {
  const params = useParams<{ tenantSlug?: string }>();
  const searchParams = useSearchParams();
  const tenantSlug = typeof params?.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : "";
  const initialFolio = useMemo(() => searchParams.get("folio")?.trim() ?? "", [searchParams]);

  const [folio, setFolio] = useState(initialFolio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortalOrderResponse["data"] | null>(null);
  const [tenant, setTenant] = useState<PortalOrderResponse["tenant"] | null>(null);
  const [tenantLabel, setTenantLabel] = useState<string>(tenantSlug || "Tenant");
  const [portalTemplate, setPortalTemplate] = useState<Record<string, unknown> | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const pdfAttachment = useMemo(() => {
    return result?.pdf_attachment ?? result?.attachments?.[0] ?? null;
  }, [result]);

  const publicWhatsappHref = useMemo(() => resolveContactWhatsapp(tenant, portalTemplate), [tenant, portalTemplate]);

  const dateSummary = result?.order.created_at
    ? (() => {
        const createdAt = new Date(result.order.created_at);
        const promiseAt = new Date(createdAt);
        promiseAt.setDate(promiseAt.getDate() + 3);
        const now = new Date();
        const remainingMs = promiseAt.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

        return {
          promiseDate: promiseAt.toLocaleDateString(),
          remainingDays,
          lastUpdate: createdAt.toLocaleDateString(),
        };
      })()
    : null;

  // Fetch tenant info on mount
  useEffect(() => {
    if (!tenantSlug) {
      return;
    }

    setLoadingTenant(true);
    setTenantError(null);
    void (async () => {
      try {
        const res = await fetch(getPublicApiPath(`/api/public/tenant/${encodeURIComponent(tenantSlug)}/landing`));
        if (!res.ok) {
          throw new Error("No pudimos cargar este portal.");
        }

        const payload = await res.json();
        if (payload && payload.success && payload.data?.tenant) {
          setTenant(payload.data.tenant);
          setTenantLabel(payload.data.tenant.name || tenantSlug);
          setPortalTemplate(payload.data.tenant.config?.templates?.portal ?? null);
        } else {
          throw new Error("Respuesta inválida del servidor");
        }
      } catch (e) {
        setTenantError(e instanceof Error ? e.message : "No pudimos cargar este portal.");
      } finally {
        setLoadingTenant(false);
      }
    })();
  }, [tenantSlug]);

  const executeSearch = async (searchValue: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      if (!tenantSlug) {
        throw new Error("No pudimos consultar el portal.");
      }

      if (!searchValue.trim()) {
        throw new Error("Ingresa tu número de folio");
      }

      const response = await fetch(
        getPublicApiPath(`/api/public/tenant/${encodeURIComponent(tenantSlug)}/orders/${encodeURIComponent(searchValue.trim())}`)
      );
      const payload = (await response.json().catch(() => null)) as PortalOrderResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && payload.error ? "No encontramos un folio válido." : "No encontramos un folio válido.");
      }

      if (payload && "success" in payload) {
        setTenantLabel(payload.tenant.name || tenantSlug);
        setTenant(payload.tenant);
        setPortalTemplate(payload.tenant.config?.templates?.portal ?? null);
        setResult(payload.data);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos consultar el folio.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount if folio query parameter exists
  useEffect(() => {
    if (initialFolio) {
      void executeSearch(initialFolio);
    }
  }, [initialFolio]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeSearch(folio);
  };

  if (loadingTenant) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] flex items-center justify-center text-zinc-50 p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-zinc-700 border-t-sky-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Cargando taller...</p>
        </div>
      </main>
    );
  }

  if (!tenantSlug) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.13),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] px-4 py-8 text-zinc-50 flex items-center justify-center">
        <div className="w-full max-w-xl text-center space-y-6 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/88 p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mx-auto text-2xl font-bold text-sky-400">FX</div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-50">Portal no disponible</h1>
          <p className="text-zinc-400 leading-relaxed text-sm">
            No pudimos identificar el taller para este enlace.
          </p>
          <div className="pt-4">
            <Link href="/" className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Ir a la página principal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (tenantError || !tenant) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.13),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] px-4 py-8 text-zinc-50 flex items-center justify-center">
        <div className="w-full max-w-xl text-center space-y-6 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/88 p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mx-auto text-2xl font-bold text-sky-400">FX</div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-50">Taller no encontrado</h1>
          <p className="text-zinc-400 leading-relaxed text-sm">
            {tenantError || "No pudimos cargar la información del taller solicitado. Por favor, verifica el enlace."}
          </p>
          <div className="pt-4">
            <Link href="/" className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Ir a la página principal
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.13),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] px-4 py-8 text-zinc-50">
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-zinc-800/70 bg-zinc-950/88 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 rounded-[1.8rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.96))] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">FIXI</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-50 sm:text-4xl">
              {String(portalTemplate?.heroTitle ?? "Seguimiento de servicio")}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              {String(portalTemplate?.heroDescription ?? "Ingresa tu folio para ver el estado de tu servicio, abrir el PDF y guardarlo o imprimirlo en")}{" "}
              <span className="font-semibold text-zinc-200">{tenantLabel}</span>.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${tenantSlug}`} className="rounded-full border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
              Volver al tenant
            </Link>
            <Link href={`/${tenantSlug}/cotizar`} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Cotizar
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">{String(portalTemplate?.statusLabel ?? "¿Cómo va tu servicio?")}</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">Ingresa tu número de folio para ver el estado actualizado.</p>
            <div className="mt-6 rounded-[1.4rem] border border-sky-400/25 bg-zinc-950 p-4">
              <label className="mb-2 block text-sm font-semibold text-zinc-300">Folio</label>
              <input
                value={folio}
                onChange={(event) => setFolio(event.target.value)}
                className="w-full rounded-2xl border border-sky-500/50 bg-zinc-900 px-4 py-3 text-lg tracking-[0.12em] text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                required
              />
              <p className="mt-2 text-xs text-zinc-500">Ingresa el folio de tu orden de servicio.</p>
              {error ? <p className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
              <button
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_45px_rgba(249,115,22,0.32)] transition hover:-translate-y-0.5 hover:bg-orange-400 disabled:opacity-60"
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-center text-xs text-zinc-400">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Actualización diaria</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Datos seguros</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Contacto directo</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Live cam disponible</div>
            </div>
          </form>

          <div className="space-y-4">
            {!hasSearched && !result && (
              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
                <div className="flex min-h-[370px] flex-col items-center justify-center rounded-[1.5rem] border border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
                  <div className="mb-5 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                    {String(portalTemplate?.documentLabel ?? "Portal del cliente")}
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-sky-300 sm:text-4xl">
                    {String(portalTemplate?.secondaryCtaLabel ?? "Ver estado")}
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-400">
                    Consulta el estatus de tu servicio en tiempo real. Ingresa tu número de folio para ver el timeline y descargar tu PDF.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href={`/${tenantSlug}/cotizar`} className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                      {String(portalTemplate?.primaryCtaLabel ?? "Cotizar servicio")}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {hasSearched && !result && (
              <div className="rounded-[1.75rem] border border-red-500/30 bg-zinc-900/60 p-6">
                <div className="flex min-h-[370px] flex-col items-center justify-center rounded-[1.5rem] border border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
                  <div className="mb-5 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-red-200">
                    Orden no encontrada
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-red-400 sm:text-4xl">
                    Folio no existe
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-400">
                    No pudimos encontrar una orden con el folio especificado en {tenantLabel}. Por favor verifica los dígitos de tu comprobante e intenta de nuevo.
                  </p>
                </div>
              </div>
            )}

            {result && (
              <article className="rounded-[1.75rem] border border-sky-500/30 bg-[linear-gradient(180deg,rgba(16,18,27,0.98),rgba(9,10,16,0.98))] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Resultado</p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-50">{result.order.folio}</h2>
                  </div>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                    {result.orderStatusLabel}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <section className="rounded-[1.4rem] border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Información del servicio</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Servicio</span>
                        <span className="font-semibold text-zinc-50">{result.order.device_info?.type ?? "Sin tipo"}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Marca/Modelo</span>
                        <span className="font-semibold text-zinc-50">
                          {(result.order.device_info?.brand ?? "Sin marca") + (result.order.device_info?.model ? ` ${result.order.device_info.model}` : "")}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Revisión</span>
                        <span className="font-semibold text-zinc-50">{result.order.problem_description ?? "Sin descripción"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">Fecha de ingreso</span>
                        <span className="font-semibold text-zinc-50">
                          {result.order.created_at ? new Date(result.order.created_at).toLocaleDateString() : "Sin fecha"}
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[1.4rem] border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Fechas importantes</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Fecha promesa</span>
                        <span className="font-semibold text-orange-300">{dateSummary?.promiseDate ?? "Sin definir"}</span>
                      </div>
                      <div className="flex justify-between gap-4 border-b border-zinc-800 pb-2">
                        <span className="text-zinc-400">Días restantes</span>
                        <span className="font-semibold text-zinc-50">{dateSummary ? `${dateSummary.remainingDays} día${dateSummary.remainingDays === 1 ? "" : "s"}` : "Sin definir"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-zinc-400">Última actualización</span>
                        <span className="font-semibold text-zinc-50">{dateSummary?.lastUpdate ?? "Sin definir"}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="mt-4 rounded-[1.4rem] border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Seguimiento</p>
                  <div className="mt-3 space-y-3">
                    {result.timeline.map((step) => (
                      <div key={step.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-zinc-50">{step.label}</span>
                          <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">{step.status}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">Actualización pública disponible.</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <a
                    href={publicWhatsappHref ?? "#"}
                    target={publicWhatsappHref ? "_blank" : undefined}
                    rel={publicWhatsappHref ? "noreferrer" : undefined}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(16,185,129,0.3)] transition hover:-translate-y-0.5 hover:bg-emerald-400"
                  >
                    Contactar por WhatsApp
                  </a>
                  {pdfAttachment ? (
                    <a
                      href={pdfAttachment.url}
                      target="_blank"
                      rel="noreferrer"
                      download={pdfAttachment.fileName ?? undefined}
                      className="inline-flex items-center justify-center rounded-2xl bg-zinc-500 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 hover:bg-zinc-400"
                    >
                      Imprimir / Guardar
                    </a>
                  ) : (
                    <button type="button" disabled className="inline-flex items-center justify-center rounded-2xl bg-zinc-700 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-300">
                      Imprimir / Guardar
                    </button>
                  )}
                </div>
              </article>
            )}
          </div>
        </div>

        <footer className="mt-8 border-t border-zinc-800 pt-6 text-center text-sm text-zinc-500">
          © 2026 FIXI · Todos los derechos reservados · Aviso de privacidad
        </footer>
      </section>
    </main>
  );
}
