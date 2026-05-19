"use client";

import { useState, type FormEvent } from "react";

export default function TenantQuotePage({
  params,
}: {
  params: { tenant: string };
}) {
  const [form, setForm] = useState({
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!apiUrl) throw new Error("Falta configurar NEXT_PUBLIC_API_URL");
      const response = await fetch(`${apiUrl}/api/public/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: params.tenant, ...form }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "No se pudo enviar tu solicitud");
      setMessage(`Solicitud enviada. Folio: ${payload.data?.folio ?? "pendiente"}.`);
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
          <p className="text-xs uppercase tracking-[0.35em] text-amber-700">Cotizador</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight [font-family:var(--font-cormorant)]">
            Solicita tu presupuesto
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Tenant: <span className="font-semibold text-slate-950">{params.tenant}</span>
          </p>
        </div>

        <form onSubmit={submit} className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          {[
            ["Nombre", "fullName", "text", "Tu nombre"],
            ["WhatsApp", "phone", "tel", "81 1234 5678"],
            ["Correo", "email", "email", "cliente@email.com"],
            ["Marca", "deviceBrand", "text", "Laptop / Surface / iPhone"],
            ["Modelo", "deviceModel", "text", "Modelo exacto"],
          ].map(([label, key, type, placeholder]) => (
            <div key={key as string}>
              <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
              <input
                type={type as string}
                value={(form as Record<string, string>)[key as string]}
                onChange={(e) => setForm((current) => ({ ...current, [key as string]: e.target.value }))}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
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
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
              rows={4}
              placeholder="Describe la falla"
              required
            />
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

          <button disabled={loading} className="rounded-full bg-amber-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60">
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      </section>
    </main>
  );
}
