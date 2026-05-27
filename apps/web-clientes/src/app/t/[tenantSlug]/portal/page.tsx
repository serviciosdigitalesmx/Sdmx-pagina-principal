"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "next/navigation";

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
    attachments: unknown[];
  };
};

function resolveApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_RENDER_API_URL ||
    "https://sdmx-backend-api.onrender.com"
  ).replace(/\/$/, "");
}

function resolveWhatsappHref(phone?: string) {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  return digits.length > 0 ? `https://wa.me/${digits}` : undefined;
}

export default function PortalPage() {
  const params = useParams<{ tenantSlug?: string }>();
  const searchParams = useSearchParams();
  const tenantSlug = typeof params?.tenantSlug === "string" && params.tenantSlug.trim().length > 0 ? params.tenantSlug : "";
  const [folio, setFolio] = useState(() => searchParams.get("folio")?.trim() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PortalOrderResponse["data"] | null>(null);
  const [tenant, setTenant] = useState<PortalOrderResponse["tenant"] | null>(null);
  const [tenantLabel, setTenantLabel] = useState<string>(tenantSlug || "Tenant");

  const apiBaseUrl = resolveApiBaseUrl();

  const whatsappHref = useMemo(() => {
    const contactPhone = tenant?.contact_phone;
    return resolveWhatsappHref(contactPhone || undefined);
  }, [tenant]);

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

      if (!tenantSlug) {
        throw new Error("Tenant slug ausente en la ruta");
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.16),_transparent_30%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_48%,#ffffff_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#1f2937]">Portal del cliente</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">
              Consulta real de reparación
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Ingresa tu folio para consultar una orden del taller <span className="font-semibold text-slate-950">{tenantLabel}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {tenantSlug ? (
                <>
                  <Link href={`/${tenantSlug}`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                    Volver al inicio
                  </Link>
                  <Link href={`/t/${tenantSlug}/portal`} className="rounded-full bg-[#334155] px-5 py-3 font-semibold text-white transition hover:bg-[#1f2937]">
                    Refrescar portal
                  </Link>
                </>
              ) : (
                <span className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-500">
                  Define el tenant en la URL
                </span>
              )}
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1f2937]">Qué consulta</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• Estado real de la orden.</li>
              <li>• Equipo, falla y fecha de ingreso.</li>
              <li>• WhatsApp del taller cuando exista en la orden.</li>
              <li>• Timeline derivado del estado actual.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Folio de recepción</label>
            <input
              value={folio}
              onChange={(event) => setFolio(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#334155] focus:ring-2 focus:ring-[#334155]/20"
              placeholder="ORD-XXXXXXXX"
              required
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-[#334155] px-6 py-3 font-semibold text-white transition hover:bg-[#1f2937] disabled:opacity-60">
              {loading ? "Consultando..." : "Buscar orden"}
            </button>
            <p className="text-sm leading-6 text-slate-600">
              La consulta respeta el taller al que pertenece el folio.
            </p>
          </div>
        </form>

        {result ? (
          <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#1f2937]">Orden encontrada</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-950">{result.order.folio}</h2>
                </div>
                <span className="rounded-full bg-[#475569]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#475569]">
                  {result.orderStatusLabel}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Cliente</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-950">{result.order.device_info?.customer_name ?? "Sin cliente"}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Equipo</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-950">
                    {result.order.device_info?.brand ?? result.order.device_info?.type ?? "Sin dispositivo"}{" "}
                    {result.order.device_info?.model ? `· ${result.order.device_info.model}` : ""}
                  </dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Falla reportada</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-700">{result.order.problem_description ?? "Sin descripción"}</dd>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Ingreso</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-950">
                    {result.order.created_at ? new Date(result.order.created_at).toLocaleString() : "Sin fecha"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#1f2937]">Timeline</p>
                <div className="mt-4 space-y-3">
                  {result.timeline.map((step) => (
                    <div key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-slate-950">{step.label}</span>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{step.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{step.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <aside className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WhatsApp del taller</p>
                <p className="mt-1 text-sm text-slate-700">
                  {tenant?.contact_phone ?? "No hay teléfono de contacto registrado"}
                </p>
                {whatsappHref ? (
                  <a href={whatsappHref} className="mt-3 inline-block font-semibold text-[#1f2937]">
                    Abrir WhatsApp
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Documentos y fotos</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {result.attachments.length > 0 ? "Adjuntos disponibles." : "No hay adjuntos registrados para esta orden."}
                </p>
              </div>
            </aside>
          </section>
        ) : null}
      </section>
    </main>
  );
}
