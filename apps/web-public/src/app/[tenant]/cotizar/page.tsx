"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const fieldClassName =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20";

export default function TenantQuotePage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
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
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!apiUrl) {
        throw new Error("Falta configurar NEXT_PUBLIC_API_URL o NEXT_PUBLIC_API_BASE_URL");
      }

      const response = await fetch(`${apiUrl}/api/public/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug: tenant, ...form }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "No se pudo enviar tu solicitud");
      }

      setMessage(`Solicitud enviada. Folio: ${payload.data?.folio ?? "pendiente"}.`);
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(44,110,159,0.12),_transparent_26%),linear-gradient(180deg,#f4f6f9_0%,#eef2f6_50%,#f8fafc_50%,#ffffff_100%)] px-4 py-8 text-slate-950">
      <section className="mx-auto grid w-full max-w-5xl gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#245a82]">Cotizador</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 [font-family:var(--font-cormorant)]">
              Solicita tu presupuesto
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Cuéntanos qué equipo tienes, qué falla presenta y lo convertimos en una solicitud real para el tenant{" "}
              <span className="font-semibold text-slate-950">{tenant}</span>.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/${params.tenant}`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                Volver al tenant
              </Link>
              <Link href={`/${params.tenant}/tracking`} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                Ver estatus
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-[#2c6e9f]/15 bg-[#2c6e9f]/8 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#245a82]">Qué ocurre al enviar</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>• La solicitud se envía al API real.</li>
              <li>• Se asocia al tenant actual.</li>
              <li>• Recepción puede darle seguimiento sin perder contexto.</li>
            </ul>
          </aside>
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

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading} className="rounded-full bg-[#2c6e9f] px-6 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:opacity-60">
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
            <p className="text-sm leading-6 text-slate-500">
              La solicitud llega al API real y queda ligada al tenant actual.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
