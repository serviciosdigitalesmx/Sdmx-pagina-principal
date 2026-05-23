"use client";

import { useMemo } from "react";

export type OrderIntakeFormState = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  deviceType: string;
  deviceModel: string;
  issue: string;
};

export type OrderIntakeFiles = {
  intakePhoto: File | null;
  documents: File[];
};

type Props = {
  open: boolean;
  saving: boolean;
  error: string;
  form: OrderIntakeFormState;
  files: OrderIntakeFiles;
  onClose: () => void;
  onChange: (name: keyof OrderIntakeFormState, value: string) => void;
  onPhotoChange: (file: File | null) => void;
  onDocumentsChange: (files: File[]) => void;
  onSubmit: () => void;
};

function whatsappLink(phone: string, folioBase = "ORD") {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const message = encodeURIComponent(`Hola, te contacto desde Sr. Fix sobre tu orden ${folioBase}.`);
  return `https://wa.me/${normalized}?text=${message}`;
}

export function OrderIntakeModal({ open, saving, error, form, files, onClose, onChange, onPhotoChange, onDocumentsChange, onSubmit }: Props) {
  const waLink = useMemo(() => whatsappLink(form.clientPhone), [form.clientPhone]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_90px_rgba(15,23,42,0.16)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Recepción operativa</h2>
            <p className="text-sm text-slate-600">Alta real con foto, PDFs y salida directa a WhatsApp.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 transition hover:text-slate-900">✕</button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="clientName" value={form.clientName} onChange={(e) => onChange("clientName", e.target.value)} placeholder="Nombre completo" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20" />
            <input name="clientPhone" value={form.clientPhone} onChange={(e) => onChange("clientPhone", e.target.value)} placeholder="WhatsApp" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20" />
            <input name="clientEmail" value={form.clientEmail} onChange={(e) => onChange("clientEmail", e.target.value)} placeholder="Correo opcional" type="email" className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20" />
            <select name="deviceType" value={form.deviceType} onChange={(e) => onChange("deviceType", e.target.value)} className="rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20">
              <option>Smartphone</option>
              <option>Laptop</option>
              <option>Consola</option>
              <option>Tablet</option>
            </select>
          </div>

          <input name="deviceModel" value={form.deviceModel} onChange={(e) => onChange("deviceModel", e.target.value)} placeholder="Modelo exacto" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20" />
          <textarea name="issue" value={form.issue} onChange={(e) => onChange("issue", e.target.value)} rows={4} placeholder="Describe el problema" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#2c6e9f] focus:ring-2 focus:ring-[#2c6e9f]/20" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Foto de entrada</label>
              <input type="file" accept="image/*" onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)} />
              {files.intakePhoto ? <p className="mt-2 text-sm text-slate-600">{files.intakePhoto.name}</p> : <p className="mt-2 text-sm text-slate-500">Sin foto seleccionada.</p>}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">PDFs adjuntos</label>
              <input type="file" accept="application/pdf" multiple onChange={(e) => onDocumentsChange(Array.from(e.target.files ?? []))} />
              {files.documents.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {files.documents.map((file) => (
                    <li key={`${file.name}-${file.size}`}>{file.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Sin documentos seleccionados.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={waLink ?? "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!waLink}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                waLink ? "bg-[#1b9e5e] text-white" : "pointer-events-none bg-slate-200 text-slate-400"
              }`}
            >
              WhatsApp directo
            </a>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                Cancelar
              </button>
              <button type="button" onClick={onSubmit} disabled={saving} className="rounded-full bg-[#2c6e9f] px-5 py-3 font-semibold text-white transition hover:bg-[#245a82] disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Creando..." : "Crear orden"}
              </button>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
