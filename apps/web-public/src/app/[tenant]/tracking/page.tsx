"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { resolveApiBaseUrl } from "@white-label/config";

const fieldClassName =
  "w-full rounded-2xl border border-stone-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20";

export default function TenantTrackingPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalTemplate, setPortalTemplate] = useState<Record<string, unknown> | null>(null);

  const apiUrl = resolveApiBaseUrl();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const url = new URL(`${apiUrl}/api/public/tracking`);
      url.searchParams.set("tenantSlug", tenant);
      url.searchParams.set("folio", folio.trim());
      if (email.trim()) {
        url.searchParams.set("email", email.trim());
      }

      const response = await fetch(url.toString());
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo consultar el estatus");
      }

      const statusKey = String(payload?.data?.status ?? "").toLowerCase();
      const statusLabel = payload?.tenant?.config?.statusLabels?.[statusKey] ?? payload?.data?.status ?? "Sin estado";
      setStatus(`${statusLabel} · ${payload.data.problem_description}`);
      setPortalTemplate(payload?.tenant?.config?.templates?.portal ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(180,83,9,0.14),_transparent_26%),linear-gradient(180deg,#050505_0%,#0f0f10_50%,#141210_100%)] px-4 py-8 text-zinc-50">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-amber-700/15 bg-[linear-gradient(180deg,rgba(16,14,12,0.96),rgba(22,18,14,0.98))] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-100/70">Panel del cliente</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
              {String(portalTemplate?.heroTitle ?? "Ver estatus de tu servicio")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              {String(portalTemplate?.heroDescription ?? `Consulta el avance de tu servicio con el folio generado en recepción para el taller ${tenant}.`)}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${params.tenant}`} className="rounded-full border border-stone-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-white/5">
                Volver al taller
              </Link>
              <Link href={`/${params.tenant}/cotizar`} className="rounded-full border border-stone-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-white/5">
                Solicitar cotización
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-amber-700/15 bg-black/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/70">Antes de consultar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>• Ten a la mano el folio de servicio.</li>
              <li>• El correo es opcional, pero ayuda a validar la consulta.</li>
              <li>• Si ya tienes sesión, puedes entrar al panel privado.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-stone-700/70 bg-white/4 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Folio</label>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              className={fieldClassName}
              required
            />
            <p className="mt-1 text-xs text-zinc-400">El número de folio de tu orden de servicio.</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Correo opcional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              type="email"
            />
            <p className="mt-1 text-xs text-zinc-400">El correo electrónico asociado a la orden.</p>
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {status ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{status}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-amber-50 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-100 disabled:opacity-60">
              {loading ? "Consultando..." : String(portalTemplate?.primaryCtaLabel ?? "Ver estatus")}
            </button>
            <p className="text-sm leading-6 text-zinc-400">
              La consulta se hace sobre el API real y devuelve el avance del servicio.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
