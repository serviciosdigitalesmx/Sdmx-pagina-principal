"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";

type PortalOrderResponse = {
  success: true;
  tenant: {
    id: string;
    slug: string;
    name: string;
    contact_phone?: string | null;
    contact_email?: string | null;
  };
  data: {
    order: {
      folio: string;
      status: string;
      total_cost?: number | null;
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

function resolveApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

function resolveWhatsappHref(phone?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

export default function PortalPage() {
  const params = useParams<{ tenantSlug?: string }>();
  const searchParams = useSearchParams();
  const tenantSlug = typeof params?.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : "demo";
  const [folio, setFolio] = useState(searchParams.get("folio") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortalOrderResponse["data"] | null>(null);
  const [tenant, setTenant] = useState<PortalOrderResponse["tenant"] | null>(null);
  const [tenantLabel, setTenantLabel] = useState<string>(tenantSlug);

  const apiBaseUrl = resolveApiBaseUrl();

  const whatsappHref = useMemo(() => {
    const contactPhone = tenant?.contact_phone;
    return resolveWhatsappHref(contactPhone || undefined);
  }, [tenant]);

  const pdfAttachment = useMemo(() => {
    return result?.pdf_attachment ?? result?.attachments?.[0] ?? null;
  }, [result]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setTenant(null);

    try {
      if (!apiBaseUrl) {
        throw new Error("NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL no está configurada");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/public/tenant/${encodeURIComponent(tenantSlug)}/orders/${encodeURIComponent(folio.trim())}`
      );
      const payload = (await response.json().catch(() => null)) as PortalOrderResponse | { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "No encontramos la orden");
      }

      if (payload && "success" in payload) {
        setTenantLabel(payload.tenant.name || tenantSlug);
        setTenant(payload.tenant);
        setResult(payload.data);
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,#09090b_0%,#111113_48%,#18181b_100%)] px-4 py-8 text-zinc-50">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-8 shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Portal del cliente</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
              Consulta real de reparación
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              Ingresa tu folio para consultar una orden del taller <span className="font-semibold text-zinc-50">{tenantLabel}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${tenantSlug}`} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Volver al tenant
              </Link>
              <Link href={`/${tenantSlug}/cotizar`} className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400">
                Solicitar cotización
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Qué consulta</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>• Estado real de la orden.</li>
              <li>• Equipo, falla y fecha de ingreso.</li>
              <li>• WhatsApp del taller cuando exista en la orden.</li>
              <li>• Timeline derivado del estado actual.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Folio de recepción</label>
            <input
              value={folio}
              onChange={(event) => setFolio(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20"
              placeholder="ORD-XXXXXXXX"
              required
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-60">
              {loading ? "Consultando..." : "Buscar orden"}
            </button>
            <p className="text-sm leading-6 text-zinc-400">
              La consulta respeta el taller al que pertenece el folio.
            </p>
          </div>
        </form>

        {result ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950/85 p-6 shadow-[0_16px_60px_rgba(0,0,0,0.24)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Orden encontrada</p>
                  <h2 className="mt-2 text-3xl font-bold text-zinc-50">{result.order.folio}</h2>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {result.orderStatusLabel}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">Cliente</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-50">{result.order.device_info?.customer_name ?? "Sin cliente"}</dd>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">Equipo</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-50">
                    {result.order.device_info?.brand ?? result.order.device_info?.type ?? "Sin dispositivo"}{" "}
                    {result.order.device_info?.model ? `· ${result.order.device_info.model}` : ""}
                  </dd>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">Falla reportada</dt>
                  <dd className="mt-1 text-sm leading-6 text-zinc-300">{result.order.problem_description ?? "Sin descripción"}</dd>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-zinc-400">Ingreso</dt>
                  <dd className="mt-1 text-sm font-semibold text-zinc-50">
                    {result.order.created_at ? new Date(result.order.created_at).toLocaleString() : "Sin fecha"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Timeline</p>
                <div className="mt-4 space-y-3">
                  {result.timeline.map((step) => (
                    <div key={step.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-zinc-50">{step.label}</span>
                        <span className="text-xs uppercase tracking-[0.18em] text-zinc-400">{step.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">{step.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <aside className="space-y-4 rounded-[1.75rem] border border-zinc-800 bg-zinc-900/60 p-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">WhatsApp del taller</p>
                <p className="mt-1 text-sm text-zinc-300">
                  {tenant?.contact_phone ?? "No hay teléfono de contacto registrado"}
                </p>
                {whatsappHref ? (
                  <a href={whatsappHref} className="mt-3 inline-block font-semibold text-cyan-300">
                    Abrir WhatsApp
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Documentos y fotos</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {result.attachments.length > 0 ? "Adjuntos disponibles." : "No hay adjuntos registrados para esta orden."}
                </p>
                {pdfAttachment ? (
                  <a
                    href={pdfAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    download={pdfAttachment.fileName ?? undefined}
                    className="mt-3 inline-flex rounded-full bg-cyan-500 px-4 py-2 font-semibold text-zinc-950"
                  >
                    Ver PDF de la orden
                  </a>
                ) : null}
                {result.documents.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {result.documents.map((document) => (
                      <div key={document.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                        <div className="text-sm font-semibold text-zinc-50">{document.file_name}</div>
                        <div className="text-xs uppercase tracking-[0.18em] text-zinc-400">{document.file_type}</div>
                        {document.public_url ? (
                          <a href={document.public_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-cyan-300">
                            Abrir evidencia
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Eventos</p>
                <div className="mt-3 space-y-2">
                  {result.events.length > 0 ? (
                    result.events.map((event) => (
                      <div key={event.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-zinc-50">{event.event_type}</span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{new Date(event.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">{event.note ?? "Sin nota"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">No hay eventos registrados.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Mensajes</p>
                <div className="mt-3 space-y-2">
                  {result.messages.length > 0 ? (
                    result.messages.map((message) => (
                      <div key={message.id} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-zinc-50">{message.actor_name ?? "Sistema"}</span>
                          <span className="text-[11px] uppercase tracking-[0.18em] text-zinc-400">{new Date(message.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-300">{message.note ?? "Sin mensaje"}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-400">No hay mensajes registrados.</p>
                  )}
                </div>
              </div>
            </aside>
          </section>
        ) : null}
      </section>
    </main>
  );
}
