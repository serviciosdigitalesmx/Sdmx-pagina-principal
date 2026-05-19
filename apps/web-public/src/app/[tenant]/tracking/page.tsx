"use client";

import { useState, type FormEvent } from "react";

export default function TenantTrackingPage({
  params,
}: {
  params: { tenant: string };
}) {
  const [folio, setFolio] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      if (!apiUrl) throw new Error("Falta configurar NEXT_PUBLIC_API_URL");
      const url = new URL(`${apiUrl}/api/public/tracking`);
      url.searchParams.set("tenantSlug", params.tenant);
      url.searchParams.set("folio", folio.trim());
      if (email.trim()) url.searchParams.set("email", email.trim());

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
    <main className="min-h-screen bg-[linear-gradient(180deg,#050816_0%,#0f172a_50%,#f8fafc_50%,#ffffff_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto grid w-full max-w-4xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-700">Panel del cliente</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight [font-family:var(--font-cormorant)]">
            Ver estatus de tu reparación
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Tenant: <span className="font-semibold text-slate-950">{params.tenant}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Folio</label>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="ORD-XXXXXXXX"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Correo opcional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="cliente@email.com"
              type="email"
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {status ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</p> : null}

          <button disabled={loading} className="rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
            {loading ? "Consultando..." : "Ver estatus"}
          </button>
        </form>
      </section>
    </main>
  );
}
