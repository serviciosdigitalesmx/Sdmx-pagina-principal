"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const fieldClassName =
  "w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-slate-400/60 focus:ring-2 focus:ring-slate-400/20";

export default function TenantTrackingPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!apiUrl) {
        throw new Error("Falta configurar NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL");
      }

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

      setStatus(`${payload.data.status} · ${payload.data.problem_description}`);
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
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Panel del cliente</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-50 [font-family:var(--font-cormorant)]">
              Ver estatus de tu reparación
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              Consulta el avance de tu equipo con el folio generado en recepción para el taller{" "}
              <span className="font-semibold text-slate-950">{tenant}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${params.tenant}`} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Volver al taller
              </Link>
              <Link href={`/${params.tenant}/cotizar`} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-100 transition hover:bg-zinc-800">
                Solicitar cotización
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-slate-400/15 bg-slate-400/8 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">Antes de consultar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-zinc-300">
              <li>• Ten a la mano el folio de recepción.</li>
              <li>• El correo es opcional, pero ayuda a validar la consulta.</li>
              <li>• Si ya tienes sesión, puedes entrar al panel privado.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Folio</label>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              className={fieldClassName}
              placeholder="ORD-XXXXXXXX"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">Correo opcional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              placeholder="cliente@email.com"
              type="email"
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          {status ? <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{status}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-slate-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-slate-400 disabled:opacity-60">
              {loading ? "Consultando..." : "Ver estatus"}
            </button>
            <p className="text-sm leading-6 text-zinc-400">
              La consulta se hace sobre el API real y devuelve el avance del equipo.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
