"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPublicApiPath } from "@/lib/public-api";
import { Badge, SurfaceCard } from "@white-label/ui";

const fieldClassName =
  "w-full rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/15";

type PublicPortalOrderResponse = {
  success: true;
  tenant: {
    slug: string;
    name: string;
    contact_phone?: string | null;
    contactPhone?: string | null;
    config?: {
      statusLabels?: Record<string, string>;
      templates?: { portal?: Record<string, unknown> | null };
    } | null;
  };
  data: {
    order: {
      folio: string;
      status: string;
      created_at?: string;
      updated_at?: string;
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

function resolveWhatsappHref(phone?: string | null, folio?: string | null) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  const message = encodeURIComponent(`Hola, quiero consultar mi folio ${folio ?? ""}.`);
  return `https://wa.me/${digits}?text=${message}`;
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

export default function TenantTrackingPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicPortalOrderResponse["data"] | null>(null);
  const [tenantInfo, setTenantInfo] = useState<PublicPortalOrderResponse["tenant"] | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setResult(null);
    setTenantInfo(null);

    try {
      const url = getPublicApiPath(`/api/public/tenant/${encodeURIComponent(tenant)}/orders/${encodeURIComponent(folio.trim())}`);
      const response = await fetch(url);
      const payload = (await response.json().catch(() => null)) as PublicPortalOrderResponse | { error?: string } | null;

      if (!response.ok || !payload || !("success" in payload) || !payload.success) {
        throw new Error((payload as { error?: string } | null)?.error ?? "No se pudo consultar el estatus");
      }

      setTenantInfo(payload.tenant);
      setResult(payload.data);
      setStatus(`${payload.data.orderStatusLabel} · ${payload.data.order.problem_description ?? "Sin descripción"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const pdfAttachment = result?.pdf_attachment ?? result?.attachments?.[0] ?? null;
  const whatsappHref = resolveWhatsappHref(tenantInfo?.contact_phone ?? tenantInfo?.contactPhone ?? null, result?.order.folio ?? null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_26%),radial-gradient(circle_at_80%_10%,_rgba(14,165,233,0.06),_transparent_24%),linear-gradient(180deg,#020617_0%,#050b16_48%,#0b1220_100%)] px-4 py-8 text-slate-50">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(9,14,26,0.96),rgba(11,18,32,0.98))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.22)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <Badge variant="neutral">Panel del cliente</Badge>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Ver estatus de tu servicio
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Consulta el avance de tu servicio con el folio generado en recepción para el taller {tenant}.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${tenant}`} className="rounded-full border border-white/10 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/5">
                Volver al taller
              </Link>
              <Link href={`/${tenant}/cotizar`} className="rounded-full border border-white/10 px-5 py-3 font-medium text-slate-100 transition hover:bg-white/5">
                Solicitar cotización
              </Link>
            </div>
          </div>

          <SurfaceCard elevated className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/80">Antes de consultar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <li>• Ten a la mano el folio de servicio.</li>
              <li>• El correo es opcional, pero ayuda a validar la consulta.</li>
              <li>• Si ya tienes sesión, puedes entrar al panel privado.</li>
            </ul>
          </SurfaceCard>
        </div>

        <SurfaceCard elevated className="p-6">
          <form onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Folio</label>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              className={fieldClassName}
              required
            />
            <p className="mt-1 text-xs text-slate-400">El número de folio de tu orden de servicio.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Correo opcional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              type="email"
            />
            <p className="mt-1 text-xs text-slate-400">El correo electrónico asociado a la orden.</p>
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {status ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{status}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-sky-500/15 px-6 py-3 font-medium text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-60">
              {loading ? "Consultando..." : "Ver estatus"}
            </button>
            <p className="text-sm leading-6 text-slate-400">
              La consulta se hace sobre el API real y devuelve el avance del servicio.
            </p>
          </div>
          </form>
        </SurfaceCard>

        {result ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <SurfaceCard elevated className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Resultado</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{result.order.folio}</h2>
                </div>
                <Badge variant="primary">{result.orderStatusLabel}</Badge>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-xs font-semibold text-sky-200">Información del servicio</p>
                  <dl className="mt-4 space-y-3 text-sm text-slate-300">
                    <div>
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Problema</dt>
                      <dd className="mt-1">{result.order.problem_description ?? "Sin descripción"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Serie</dt>
                      <dd className="mt-1">{result.order.serial_number ?? "Sin serie"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <p className="text-xs font-semibold text-sky-200">Documentos</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {pdfAttachment ? (
                        <a href={pdfAttachment.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 font-medium text-sky-100 transition hover:bg-sky-500/20">
                          Ver PDF de recepción
                        </a>
                    ) : (
                      <p className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-400">Todavía no hay PDF disponible.</p>
                    )}
                    {result.documents.length > 0 ? (
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{result.documents.length} documento(s) vinculados</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Seguimiento detallado</p>
                <div className="mt-4 space-y-3">
                  {result.timeline.map((step) => (
                    <div key={step.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-100">{step.label}</p>
                        <p className="mt-1 text-sm text-slate-400">{step.note}</p>
                      </div>
                      <Badge variant={step.status === "completado" ? "success" : step.status === "actual" ? "primary" : "neutral"}>{step.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </SurfaceCard>

            <aside className="space-y-4">
              <SurfaceCard elevated className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estado actual</p>
                <p className="mt-2 text-2xl font-black text-slate-50">{result.orderStatusLabel}</p>
                <p className="mt-2 text-sm text-slate-400">{formatDate(result.order.updated_at ?? result.order.created_at ?? null)}</p>
              </SurfaceCard>

              <SurfaceCard elevated className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Acciones del cliente</p>
                <div className="mt-4 space-y-3">
                  {whatsappHref ? (
                    <a href={whatsappHref} target="_blank" rel="noreferrer" className="block rounded-full bg-emerald-500/15 px-4 py-3 text-center font-medium text-emerald-100 transition hover:bg-emerald-500/20">
                      Continuar por WhatsApp
                    </a>
                  ) : null}
                  {pdfAttachment?.url ? (
                    <a href={pdfAttachment.url} target="_blank" rel="noreferrer" className="block rounded-full border border-white/10 px-4 py-3 text-center font-medium text-slate-100 transition hover:bg-white/5">
                      Abrir PDF
                    </a>
                  ) : null}
                </div>
              </SurfaceCard>

              <SurfaceCard elevated className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fotografías y evidencias</p>
                <div className="mt-4 space-y-3">
                  {result.documents.length > 0 ? (
                    result.documents.map((document) => (
                      <a key={document.id} href={document.public_url ?? "#"} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/6">
                        <div className="font-semibold">{document.file_name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{document.file_type}</div>
                      </a>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-400">Aún no hay evidencias visibles.</p>
                  )}
                </div>
              </SurfaceCard>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
