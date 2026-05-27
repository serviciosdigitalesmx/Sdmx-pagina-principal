"use client";

import { useMemo } from "react";

export type OrderIntakeFormState = {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  deviceType: string;
  deviceModel: string;
  issue: string;
  includeIva: boolean;
};

export type OrderIntakeFiles = {
  intakePhotos: File[];
};

type Props = {
  open: boolean;
  saving: boolean;
  error: string;
  form: OrderIntakeFormState;
  files: OrderIntakeFiles;
  onClose: () => void;
  onChange: (name: keyof OrderIntakeFormState, value: string) => void;
  onToggleIva: (value: boolean) => void;
  onPhotoChange: (files: File[]) => void;
  onSubmit: () => void;
};

function whatsappLink(phone: string) {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const message = encodeURIComponent(
    `Bienvenido a Marca Blanca. Aquí puedes consultar el estatus de tu equipo: ${process.env.NEXT_PUBLIC_CUSTOMER_TRACKING_URL || process.env.NEXT_PUBLIC_SAAS_DEMO_URL || "https://clientes.serviciosdigitalesmx.online"}`
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export function OrderIntakeModal({ open, saving, error, form, files, onClose, onChange, onToggleIva, onPhotoChange, onSubmit }: Props) {
  const waLink = useMemo(() => whatsappLink(form.clientPhone), [form.clientPhone]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-sky-500/15 bg-[linear-gradient(180deg,rgba(13,18,32,0.98),rgba(10,14,24,0.96))] text-zinc-100 shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between border-b border-sky-500/15 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-100/70">Recepción profesional</p>
            <h2 className="mt-1 text-xl font-bold text-zinc-50">Nueva Orden de Servicio</h2>
            <p className="text-sm text-zinc-400">Recepción profesional · foto de entrada · PDF y WhatsApp reales.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5">✕</button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-3 rounded-[1.25rem] border border-sky-500/15 bg-black/20 p-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            <div className="rounded-xl bg-sky-500/15 py-3 text-sky-100">1 · Cliente</div>
            <div className="rounded-xl bg-zinc-950/60 py-3 text-zinc-300">2 · Equipo</div>
            <div className="rounded-xl bg-zinc-950/60 py-3 text-zinc-300">3 · Confirmar</div>
          </div>

          <section className="rounded-3xl border border-sky-500/15 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Paso 1</div>
                <h3 className="text-lg font-semibold text-zinc-50">Datos del cliente</h3>
              </div>
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">Obligatorio</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="clientName" value={form.clientName} onChange={(e) => onChange("clientName", e.target.value)} placeholder="Nombre completo *" className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20" />
              <input name="clientPhone" value={form.clientPhone} onChange={(e) => onChange("clientPhone", e.target.value)} placeholder="WhatsApp * (10 dígitos)" className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20" />
              <input name="clientEmail" value={form.clientEmail} onChange={(e) => onChange("clientEmail", e.target.value)} placeholder="Email (opcional)" type="email" className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20" />
              <label className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3">
                <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-400">Aplicar IVA</span>
                <input
                  type="checkbox"
                  checked={form.includeIva}
                  onChange={(e) => onToggleIva(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-sky-400 focus:ring-sky-400"
                />
              </label>
            </div>
          </section>

          <section className="rounded-3xl border border-sky-500/15 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Paso 2</div>
                <h3 className="text-lg font-semibold text-zinc-50">Información del equipo</h3>
              </div>
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">Recepción</span>
            </div>
            <div className="grid gap-4">
              <select name="deviceType" value={form.deviceType} onChange={(e) => onChange("deviceType", e.target.value)} className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20">
                <option>Selecciona...</option>
                <option>Smartphone</option>
                <option>Tablet</option>
                <option>Laptop</option>
                <option>Computadora</option>
                <option>Otro</option>
              </select>
              <input name="deviceModel" value={form.deviceModel} onChange={(e) => onChange("deviceModel", e.target.value)} placeholder="Marca y modelo *" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20" />
              <textarea name="issue" value={form.issue} onChange={(e) => onChange("issue", e.target.value)} rows={4} placeholder="Falla reportada *" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 outline-none transition placeholder:text-zinc-500 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20" />
            </div>
          </section>

          <section className="rounded-3xl border border-sky-500/15 bg-slate-950/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-100/70">Paso 3</div>
                <h3 className="text-lg font-semibold text-zinc-50">Checklist y foto</h3>
              </div>
              <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-100">Confirmar</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-sky-400/30 bg-black/20 p-4">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">Foto del estado en recepción</label>
                <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => onPhotoChange(Array.from(e.target.files ?? []).slice(0, 3))} />
                {files.intakePhotos.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                    {files.intakePhotos.map((file) => (
                      <li key={`${file.name}-${file.size}`}>{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">Se comprimirá automáticamente para envío rápido.</p>
                )}
                <p className="mt-2 text-xs text-zinc-400">Máximo 3 fotos, capturadas desde cámara o galería.</p>
              </div>
              <div className="rounded-2xl border border-sky-400/30 bg-black/20 p-4">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-zinc-400">PDF automático</label>
                <p className="text-sm text-zinc-300">El sistema genera el PDF de cotización y recepción automáticamente. No se admiten PDFs manuales en este paso.</p>
                <p className="mt-2 text-xs text-sky-100/70">La foto de ingreso se integra al PDF final.</p>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <a
              href={waLink ?? "#"}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!waLink}
              className={`rounded-full px-5 py-3 text-sm font-semibold ${
                waLink ? "bg-emerald-500/15 text-emerald-100" : "pointer-events-none bg-zinc-800 text-zinc-500"
              }`}
            >
              WhatsApp directo
            </a>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-zinc-700 px-5 py-3 font-semibold text-zinc-200 transition hover:bg-white/5">
                Atrás
              </button>
              <button type="button" onClick={onSubmit} disabled={saving} className="rounded-full bg-sky-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60">
                {saving ? "Creando..." : "Continuar →"}
              </button>
            </div>
          </div>

          {error ? <p className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
