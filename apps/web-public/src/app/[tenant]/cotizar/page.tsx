"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const fieldClassName =
  "w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/20";

type QuotePayload = {
  fullName: string;
  phone: string;
  email: string;
  deviceBrand: string;
  deviceModel: string;
  issue: string;
};

type QuoteResponse = {
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
  };
  data: {
    id: string;
    folio: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string | null;
    device_type: string;
    device_model: string;
    issue_description: string;
    status: string;
  };
};

function resolveApiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

function buildTrackingHref(tenant: string, folio: string) {
  return `/${encodeURIComponent(tenant)}/tracking?folio=${encodeURIComponent(folio)}`;
}

export default function TenantQuotePage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const [form, setForm] = useState<QuotePayload>({
    fullName: "",
    phone: "",
    email: "",
    deviceBrand: "",
    deviceModel: "",
    issue: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [folio, setFolio] = useState<string | null>(null);
  const apiUrl = useMemo(() => resolveApiUrl(), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setFolio(null);

    try {
      if (!apiUrl) {
        throw new Error("Falta configurar NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL");
      }

      const response = await fetch(`${apiUrl}/api/public/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: tenant, ...form }),
      });

      const payload = (await response.json().catch(() => null)) as QuoteResponse | { error?: string; details?: unknown } | null;

      if (!response.ok) {
        throw new Error(payload && "error" in payload && payload.error ? payload.error : "No se pudo enviar tu solicitud");
      }

      if (!payload || !("success" in payload)) {
        throw new Error("Respuesta inválida del servidor");
      }

      setFolio(payload.data.folio);
      setMessage(`Solicitud enviada. Folio: ${payload.data.folio}. Ya quedó en el buzón del taller.`);
      setForm({
        fullName: "",
        phone: "",
        email: "",
        deviceBrand: "",
        deviceModel: "",
        issue: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_26%),linear-gradient(180deg,#09090b_0%,#111113_50%,#18181b_100%)] px-4 py-8 text-zinc-50">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-zinc-800/70 bg-zinc-950/85 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Cotizador</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
              Solicita tu presupuesto
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              Cuéntanos qué equipo tienes, qué falla presenta y lo convertimos en una solicitud para el taller{" "}
              <span className="font-semibold text-slate-950">{tenant}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${tenant}`} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Volver al taller
              </Link>
              <Link href={`/${tenant}/tracking`} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Ver estatus
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-cyan-400/15 bg-cyan-400/8 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Qué ocurre al enviar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>• La solicitud se envía para registrarse.</li>
              <li>• Se asocia al taller actual.</li>
              <li>• Recepción puede convertirla en orden con un clic.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={submit} className="grid gap-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-6">
          {[
            ["Nombre", "fullName", "text", "Tu nombre"],
            ["WhatsApp", "phone", "tel", "81 1234 5678"],
            ["Correo", "email", "email", "cliente@email.com"],
            ["Marca", "deviceBrand", "text", "Laptop / Surface / iPhone"],
            ["Modelo", "deviceModel", "text", "Modelo exacto"],
          ].map(([label, key, type, placeholder]) => (
            <div key={key as string}>
              <label className="mb-2 block text-sm font-medium text-zinc-300">{label}</label>
              <input
                type={type as string}
                value={(form as Record<string, string>)[key as string]}
                onChange={(e) => setForm((current) => ({ ...current, [key as string]: e.target.value }))}
                className={fieldClassName}
                placeholder={placeholder as string}
                required
              />
            </div>
          ))}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Problema</label>
            <textarea
              value={form.issue}
              onChange={(e) => setForm((current) => ({ ...current, issue: e.target.value }))}
              className={fieldClassName}
              rows={4}
              placeholder="Describe la falla"
              required
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}
          {folio ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4 text-sm text-zinc-300">
              <div className="font-semibold text-zinc-50">Folio real: {folio}</div>
              <Link href={buildTrackingHref(tenant, folio)} className="mt-2 inline-flex font-semibold text-cyan-300">
                Ir al tracking
              </Link>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
            <p className="text-sm leading-6 text-zinc-400">
              La solicitud queda ligada al taller actual.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
