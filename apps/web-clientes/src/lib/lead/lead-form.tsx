"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { SurfaceCard } from "@white-label/ui";
import { submitPublicQuote } from "../api/leads";
import type { TenantFieldDefinition } from "../types";

type LeadFormProps = {
  tenantSlug: string;
  tenantName: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  fieldDefinitions?: TenantFieldDefinition[];
};

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  deviceBrand: string;
  deviceModel: string;
  issue: string;
  deviceType: string;
  serialNumber: string;
  priorityLevel: string;
  passwordOrPin: string;
};

const initialState: FormState = {
  fullName: "",
  phone: "",
  email: "",
  deviceBrand: "",
  deviceModel: "",
  issue: "",
  deviceType: "",
  serialNumber: "",
  priorityLevel: "",
  passwordOrPin: "",
};

function findSerialFieldDefinition(definitions: TenantFieldDefinition[]) {
  return definitions.find((definition) => definition.entity === "service_requests" && definition.field_key === "serial_number" && definition.visible !== false) ?? null;
}

export function LeadForm({ tenantSlug, tenantName, contactPhone, contactEmail, fieldDefinitions = [] }: LeadFormProps) {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const update = (key: keyof FormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const serialFieldDefinition = findSerialFieldDefinition(fieldDefinitions);

    if (serialFieldDefinition?.required && !form.serialNumber.trim()) {
      setLoading(false);
      setError(`Falta completar el campo requerido: ${serialFieldDefinition.field_label}`);
      return;
    }

    try {
      const payload = await submitPublicQuote({
        tenantSlug,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        deviceBrand: form.deviceBrand.trim(),
        deviceModel: form.deviceModel.trim(),
        issue: form.issue.trim(),
        deviceType: form.deviceType.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        priorityLevel: form.priorityLevel.trim() || undefined,
        passwordOrPin: form.passwordOrPin.trim() || undefined,
      });

      if (!payload.success) {
        throw new Error("No fue posible enviar la solicitud");
      }

      setSuccess(`Solicitud enviada correctamente. Folio: ${payload.data?.folio ?? "pendiente"}`);
      setForm(initialState);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error al enviar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  const serialFieldDefinition = findSerialFieldDefinition(fieldDefinitions);

  return (
    <SurfaceCard elevated className="p-6" style={{ borderColor: "var(--tenant-border)" }}>
      <form onSubmit={handleSubmit}>
      <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--tenant-accent)" }}>Solicitar reparación</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">Envío real de solicitud</h3>
      <p className="mt-2 text-sm leading-7 text-zinc-300">La solicitud se envía al backend real del tenant. Si falla, verás el error real del API.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <input value={form.fullName} onChange={update("fullName")} required placeholder="Nombre completo" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input value={form.phone} onChange={update("phone")} required placeholder="Teléfono" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input value={form.email} onChange={update("email")} placeholder="Email" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input value={form.deviceBrand} onChange={update("deviceBrand")} required placeholder="Marca" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input value={form.deviceModel} onChange={update("deviceModel")} required placeholder="Modelo" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input value={form.deviceType} onChange={update("deviceType")} placeholder="Tipo de equipo" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none" />
        <input
          value={form.serialNumber}
          onChange={update("serialNumber")}
          required={Boolean(serialFieldDefinition?.required)}
          placeholder={serialFieldDefinition?.placeholder ?? "Serie / IMEI"}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none"
        />
        <select value={form.priorityLevel} onChange={update("priorityLevel")} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none">
          <option value="">Nivel de urgencia</option>
          <option value="Normal">Normal</option>
          <option value="Alta">Alta</option>
          <option value="Urgente">Urgente</option>
        </select>
        <textarea value={form.issue} onChange={update("issue")} required placeholder="Describe la falla" className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none sm:col-span-2" />
        <input value={form.passwordOrPin} onChange={update("passwordOrPin")} placeholder="PIN / contraseña" className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-zinc-50 outline-none sm:col-span-2" />
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}
      {success ? <p className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={loading} className="rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60" style={{ backgroundColor: "var(--tenant-primary)", borderRadius: "var(--tenant-cta-radius)" }}>
          {loading ? "Enviando..." : "Enviar solicitud"}
        </button>
        {contactPhone ? (
          <a href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="rounded-full border px-5 py-3 text-sm font-semibold text-zinc-100" style={{ borderColor: "var(--tenant-border)" }}>
            WhatsApp
          </a>
        ) : null}
        {contactEmail ? (
          <a href={`mailto:${contactEmail}`} className="rounded-full border px-5 py-3 text-sm font-semibold text-zinc-100" style={{ borderColor: "var(--tenant-border)" }}>
            Email
          </a>
        ) : null}
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-400">{tenantName}</p>
      </form>
    </SurfaceCard>
  );
}
