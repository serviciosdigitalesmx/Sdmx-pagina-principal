"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const fieldClassName =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_26%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_50%,#f8fafc_50%,#ffffff_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Panel del cliente</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">
              Ver estatus de tu reparación
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Consulta el avance de tu equipo con el folio generado en recepción para el tenant{" "}
              <span className="font-semibold text-slate-950">{tenant}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${params.tenant}`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                Volver al tenant
              </Link>
              <Link href={`/${params.tenant}/cotizar`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                Solicitar cotización
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-[#2c6e9f]/15 bg-[#2c6e9f]/8 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Antes de consultar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• Ten a la mano el folio de recepción.</li>
              <li>• El correo es opcional, pero ayuda a validar la consulta.</li>
              <li>• Si ya tienes sesión, puedes entrar al panel privado.</li>
            </ul>
          </aside>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Folio</label>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              className={fieldClassName}
              placeholder="ORD-XXXXXXXX"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Correo opcional</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClassName}
              placeholder="cliente@email.com"
              type="email"
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {status ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-[#2c6e9f] px-6 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:opacity-60">
              {loading ? "Consultando..." : "Ver estatus"}
            </button>
            <p className="text-sm leading-6 text-slate-500">
              La consulta se hace sobre el API real y devuelve el avance del equipo.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
