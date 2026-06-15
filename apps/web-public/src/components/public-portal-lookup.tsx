"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import { fetchJson, type ApiErrorPayload } from "@white-label/config";
import { srFixTheme } from "@/components/srfix-theme";
import { resolveAdminUrl } from "@/lib/admin-url";

type PublicPortalOrderResponse = {
  success: true;
  tenant: {
    id: string;
    slug: string;
    name: string;
    branding?: {
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
    } | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contact_phone?: string | null;
    contact_email?: string | null;
    config?: {
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
      updated_at?: string;
      promised_date?: string | null;
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

function resolveWhatsappHref(phone?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

export function PublicPortalLookup({
  initialTenantSlug = "",
  initialFolio = "",
  title = "Portal del cliente",
  subtitle = "Consulta el folio de tu servicio con datos reales del taller.",
  showTenantInput = true,
}: {
  initialTenantSlug?: string;
  initialFolio?: string;
  title?: string;
  subtitle?: string;
  showTenantInput?: boolean;
}) {
  const [tenantSlug, setTenantSlug] = useState(initialTenantSlug);
  const [folio, setFolio] = useState(initialFolio);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PublicPortalOrderResponse["data"] | null>(null);
  const [tenant, setTenant] = useState<PublicPortalOrderResponse["tenant"] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const initialLookupRan = useRef(false);

  const whatsappHref = useMemo(() => resolveWhatsappHref(tenant?.contact_phone ?? tenant?.contactPhone ?? null), [tenant]);

  const executeSearch = useCallback(async (targetTenant: string, targetFolio: string) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResult(null);
    setTenant(null);

    try {
      if (!targetTenant.trim()) {
        throw new Error("Escribe el tenant del taller");
      }

      if (!targetFolio.trim()) {
        throw new Error("Escribe el folio");
      }

      const payload = await fetchJson<PublicPortalOrderResponse>(
        `/api/public/tenant/${encodeURIComponent(targetTenant.trim())}/orders/${encodeURIComponent(targetFolio.trim())}`
      );
      setTenant(payload.tenant);
      setResult(payload.data);
    } catch (submitError) {
      const apiError = submitError as ApiErrorPayload | Error;
      setError(apiError instanceof Error ? apiError.message : "Error inesperado");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLookupRan.current && initialTenantSlug && initialFolio) {
      initialLookupRan.current = true;
      const timeout = window.setTimeout(() => {
        void executeSearch(initialTenantSlug, initialFolio);
      }, 0);
      return () => window.clearTimeout(timeout);
    }
  }, [initialTenantSlug, initialFolio, executeSearch]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    executeSearch(tenantSlug, folio);
  };

  const pdfAttachment = result?.pdf_attachment ?? result?.attachments?.[0] ?? null;
  const adminBaseUrl = resolveAdminUrl();
  const adminLoginUrl = adminBaseUrl ? `${adminBaseUrl}/login` : "/login";

  return (
    <main className="min-h-screen px-4 py-8 text-zinc-50" style={{ background: srFixTheme.background }}>
      <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-zinc-800/70 bg-zinc-950/88 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)] sm:p-8">
        <div className="flex flex-col gap-6 rounded-[1.8rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(10,10,12,0.96))] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-sky-300/80">FIXI</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/5">
              Inicio
            </Link>
            <Link href={adminLoginUrl} className="rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
              Entrar
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Consulta pública</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">Ingresa el tenant y el folio para ver el estado actualizado.</p>

            {showTenantInput ? (
              <div className="mt-6">
                <label className="mb-2 block text-sm font-semibold text-zinc-300">Tenant</label>
                <input
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                  className="w-full rounded-2xl border border-sky-500/50 bg-zinc-900 px-4 py-3 text-lg tracking-[0.05em] text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
                  required
                />
                <p className="mt-2 text-xs text-zinc-500">Nombre identificador único de tu taller.</p>
              </div>
            ) : (
              <input type="hidden" value={tenantSlug} />
            )}

            <div className="mt-4 rounded-[1.4rem] border border-sky-400/25 bg-zinc-950 p-4">
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
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Datos reales</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Tenant aislado</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Documentos</div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-4">Timeline</div>
            </div>
          </form>

          <div className="space-y-4">
            {!hasSearched && !result && (
              <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
                <div className="flex min-h-[370px] flex-col items-center justify-center rounded-[1.5rem] border border-zinc-800 bg-zinc-950 px-6 py-10 text-center">
                  <div className="mb-5 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                    Portal del cliente
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-sky-300 sm:text-4xl">Ver estado</h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-400">
                    Consulta el estatus de tu servicio en tiempo real. Ingresa el tenant del taller y tu folio para continuar.
                  </p>
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
                    No existe el folio
                  </h2>
                  <p className="mt-3 max-w-lg text-sm leading-7 text-zinc-400 font-medium">
                    {error || "No pudimos encontrar la orden con ese folio en el taller seleccionado. Por favor verifica tus datos e intenta de nuevo."}
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
                      <p><span className="text-zinc-400">Cliente:</span> {result.order.device_info?.customer_name ?? "No disponible"}</p>
                      <p><span className="text-zinc-400">Equipo:</span> {(result.order.device_info?.brand ?? result.order.device_info?.type ?? "Equipo") + " / " + (result.order.device_info?.model ?? "Modelo")}</p>
                      <p><span className="text-zinc-400">Serie:</span> {result.order.serial_number ?? "No disponible"}</p>
                      <p><span className="text-zinc-400">Total:</span> {typeof result.order.final_cost === "number" ? `$${result.order.final_cost.toFixed(2)} MXN` : "No disponible"}</p>
                    </div>
                  </section>
                  <section className="rounded-[1.4rem] border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Documentos</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <p><span className="text-zinc-400">PDF:</span> {pdfAttachment?.url ? "Disponible" : "Pendiente"}</p>
                      <p><span className="text-zinc-400">Mensajes:</span> {result.messages.length}</p>
                      <p><span className="text-zinc-400">Eventos:</span> {result.events.length}</p>
                      <p><span className="text-zinc-400">Fecha:</span> {result.order.created_at ? new Date(result.order.created_at).toLocaleString("es-MX") : "No disponible"}</p>
                    </div>
                  </section>
                </div>

                <div className="mt-6 grid gap-3">
                  {result.timeline.map((step) => (
                    <div key={step.label} className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold text-zinc-100">{step.label}</p>
                        <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">{step.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">{step.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {pdfAttachment?.url ? (
                    <a
                      href={pdfAttachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                    >
                      Abrir PDF
                    </a>
                  ) : null}
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                    >
                      Contactar por WhatsApp
                    </a>
                  ) : null}
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
