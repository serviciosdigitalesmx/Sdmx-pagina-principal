"use client";

import { useMemo, useState } from "react";

export type OrderIntakeFormState = {
  quoteFolio: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  deviceType: string;
  deviceModel: string;
  issue: string;
  hasCharger: boolean;
  screenCondition: boolean;
  powersOn: boolean;
  backupRequired: boolean;
  intakeNotes: string;
  promisedDate: string;
  estimatedCost: string;
  includeIva: boolean;
};

export type OrderIntakeFiles = {
  intakePhotos: File[];
};

export type OrderCreationSummary = {
  folio: string;
  orderId: string;
  phone: string;
  portalUrl: string | null;
  pdfUrl: string | null;
  whatsappUrl: string | null;
};

type Props = {
  open: boolean;
  saving: boolean;
  error: string;
  form: OrderIntakeFormState;
  files: OrderIntakeFiles;
  successSummary: OrderCreationSummary | null;
  customerPortalBase: string;
  tenantSlug: string | null;
  onClose: () => void;
  onResetFlow: () => void;
  onChange: (name: keyof OrderIntakeFormState, value: string | boolean) => void;
  onPhotoChange: (files: File[]) => void;
  onSubmit: () => void;
  onCopy: (value: string, label: string) => void;
};

function buildWhatsAppUrl(phone: string, portalUrl: string) {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const message = encodeURIComponent(`Bienvenido a Servicios Digitales MX. Aquí puedes consultar el estado de tu orden: ${portalUrl}`);
  return `https://wa.me/${normalized}?text=${message}`;
}

function formatDate(dateIso: string) {
  const parsed = new Date(dateIso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "full", timeStyle: "short" }).format(parsed);
}

export function OrderIntakeModal({
  open,
  saving,
  error,
  form,
  files,
  successSummary,
  customerPortalBase,
  tenantSlug,
  onClose,
  onResetFlow,
  onChange,
  onPhotoChange,
  onSubmit,
  onCopy,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const portalUrl = useMemo(() => {
    if (!successSummary?.folio || !tenantSlug) return "";
    const base = customerPortalBase.replace(/\/$/, "");
    return `${base}/t/${encodeURIComponent(tenantSlug)}/portal?folio=${encodeURIComponent(successSummary.folio)}`;
  }, [customerPortalBase, successSummary?.folio, tenantSlug]);

  const whatsappUrl = useMemo(() => {
    if (!successSummary) return null;
    return buildWhatsAppUrl(successSummary.phone, portalUrl);
  }, [portalUrl, successSummary]);

  if (!open) {
    return null;
  }

  const stepOneComplete = Boolean(form.clientName.trim() && form.clientPhone.trim());
  const stepTwoComplete = Boolean(form.deviceType.trim() && form.deviceModel.trim() && form.issue.trim());
  const stepThreeComplete = Boolean(form.promisedDate.trim() && form.estimatedCost.trim());

  const dateLabel = form.promisedDate ? form.promisedDate.split("-").reverse().join("/") : "";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[1180px] flex-col overflow-hidden border border-sky-500/10 bg-[linear-gradient(180deg,rgba(13,18,32,0.98),rgba(10,14,24,0.96))] shadow-[0_24px_90px_rgba(15,23,42,0.28)]">
        <div className="flex items-center justify-between border-b border-sky-500/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recepción</p>
            <h2 className="text-[2rem] font-semibold leading-none text-zinc-50">Nueva recepción</h2>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => document.documentElement.requestFullscreen().catch(() => undefined)} className="rounded-2xl border border-zinc-700/80 bg-slate-950 px-4 py-3 text-sm font-semibold text-zinc-100">
              Pantalla completa
            </button>
            <button type="button" onClick={onClose} className="rounded-2xl border border-zinc-700/80 bg-slate-950 px-4 py-3 text-sm font-semibold text-zinc-100">
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!successSummary ? (
            <>
              <div className="mx-auto mb-6 flex max-w-xl items-center justify-center rounded-full border border-sky-500/20 bg-black/20 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-semibold text-slate-200">Nueva Orden de Servicio</div>
                  <div className="text-sm text-zinc-400">Recepción profesional · {formatDate(new Date().toISOString())}</div>
                  <button type="button" onClick={onClose} className="ml-2 text-sm font-semibold text-zinc-400">Salir</button>
                </div>
              </div>

              <div className="mx-auto mb-8 flex max-w-[340px] items-center justify-center rounded-full border border-sky-500/20 bg-slate-950/40 p-2">
                {[1, 2, 3].map((currentStep) => {
                  const completed = currentStep < step;
                  const active = currentStep === step;
                  return (
                    <div key={currentStep} className="flex items-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${completed ? "bg-emerald-500 text-white" : active ? "bg-sky-500 text-white" : "border border-sky-500/40 bg-slate-900 text-zinc-300"}`}>
                        {completed ? "✓" : currentStep}
                      </div>
                      {currentStep < 3 ? <div className={`h-1 w-10 ${currentStep < step ? "bg-sky-500" : "bg-slate-700"}`} /> : null}
                    </div>
                  );
                })}
              </div>

              <div className="mx-auto max-w-[760px] rounded-[28px] border border-sky-500/15 bg-slate-950/65 p-5 shadow-[0_12px_50px_rgba(0,0,0,0.24)]">
                {step === 1 ? (
                  <section className="space-y-5">
                    <div className="rounded-[22px] border border-sky-500/10 bg-black/20 p-4">
                      <div className="mb-3 text-sm font-semibold text-zinc-300">Cargar por folio de cotización (opcional)</div>
                      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                        <input
                          value={form.quoteFolio}
                          onChange={(e) => onChange("quoteFolio", e.target.value)}
                          placeholder="EJ: COT-00001"
                          className="rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500"
                        />
                        <button type="button" className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white">
                          Cargar folio
                        </button>
                        <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-zinc-700 bg-slate-950 px-5 py-3 font-semibold text-zinc-100">
                          Empezar en cero
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-4 text-xl font-semibold text-sky-400">Datos del Cliente</h3>
                      <div className="grid gap-4">
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">Nombre completo *</span>
                          <input value={form.clientName} onChange={(e) => onChange("clientName", e.target.value)} placeholder="Ej: Juan Pérez" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">WhatsApp * (10 dígitos)</span>
                          <input value={form.clientPhone} onChange={(e) => onChange("clientPhone", e.target.value)} placeholder="5512345678" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">Email (opcional)</span>
                          <input value={form.clientEmail} onChange={(e) => onChange("clientEmail", e.target.value)} placeholder="cliente@email.com" type="email" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button type="button" disabled={!stepOneComplete} onClick={() => setStep(2)} className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        Continuar →
                      </button>
                    </div>
                  </section>
                ) : null}

                {step === 2 ? (
                  <section className="space-y-5">
                    <div>
                      <h3 className="mb-4 text-xl font-semibold text-sky-400">Información del Equipo</h3>
                      <div className="grid gap-4">
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">Tipo de dispositivo *</span>
                          <select value={form.deviceType} onChange={(e) => onChange("deviceType", e.target.value)} className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none">
                            <option value="">Selecciona...</option>
                            <option>Smartphone</option>
                            <option>Tablet</option>
                            <option>Laptop</option>
                            <option>Computadora</option>
                            <option>Otro</option>
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">Marca y modelo *</span>
                          <input value={form.deviceModel} onChange={(e) => onChange("deviceModel", e.target.value)} placeholder="Ej: iPhone 13 Pro" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm text-zinc-300">Falla reportada *</span>
                          <textarea value={form.issue} onChange={(e) => onChange("issue", e.target.value)} placeholder="Describe el problema que comenta el cliente" rows={5} className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-sky-500/10 bg-black/20 p-4">
                      <div className="mb-3 text-lg font-semibold text-sky-400">Checklist de Recepción:</div>
                      <div className="grid gap-5 md:grid-cols-2">
                        {[
                          ["hasCharger", "⚡ Trae cargador"],
                          ["screenCondition", "Pantalla OK"],
                          ["powersOn", "⏻ Equipo prende"],
                          ["backupRequired", "🟣 Datos respaldados"],
                        ].map(([key, label]) => (
                          <label key={key} className="flex items-center gap-3 text-zinc-100">
                            <input
                              type="checkbox"
                              checked={Boolean(form[key as keyof OrderIntakeFormState])}
                              onChange={(e) => onChange(key as keyof OrderIntakeFormState, e.target.checked)}
                              className="h-5 w-5 rounded border-zinc-700"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-sky-500/10 bg-black/20 p-4">
                      <div className="mb-3 text-lg font-semibold text-slate-200">Foto del estado en recepción</div>
                      <input type="file" accept="image/*" capture="environment" multiple onChange={(e) => onPhotoChange(Array.from(e.target.files ?? []))} className="text-sm text-zinc-300" />
                      <p className="mt-3 text-sm text-zinc-400">Se comprimirá automáticamente para envío rápido.</p>
                      {files.intakePhotos.length > 0 ? <p className="mt-2 text-sm text-sky-300">{files.intakePhotos[0].name}</p> : null}
                    </div>

                    <div className="flex justify-between">
                      <button type="button" onClick={() => setStep(1)} className="rounded-2xl border border-zinc-700 bg-slate-950 px-8 py-4 text-lg font-semibold text-zinc-100">
                        Atrás
                      </button>
                      <button type="button" disabled={!stepTwoComplete} onClick={() => setStep(3)} className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        Continuar →
                      </button>
                    </div>
                  </section>
                ) : null}

                {step === 3 ? (
                  <section className="space-y-5">
                    <div>
                      <h3 className="mb-4 text-xl font-semibold text-sky-400">Confirmar Orden</h3>
                      <div className="rounded-[22px] border border-sky-500/10 bg-black/20 p-4 text-sm text-zinc-200">
                        <div className="grid gap-3">
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Cliente:</span><span className="font-semibold text-zinc-50">{form.clientName || "-"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Teléfono:</span><span className="font-semibold text-zinc-50">{form.clientPhone || "-"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Email:</span><span className="font-semibold text-zinc-50">{form.clientEmail || "(no proporcionado)"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Equipo:</span><span className="font-semibold text-zinc-50">{`${form.deviceType || "-"} - ${form.deviceModel || "-"}`}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Falla:</span><span className="font-semibold text-zinc-50">{form.issue || "-"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Checklist:</span><span className="font-semibold text-zinc-50">{[form.hasCharger ? "⚡ Cargador" : null, form.powersOn ? "⏻ Prende" : null, form.screenCondition ? "Pantalla OK" : null, form.backupRequired ? "Respaldado" : null].filter(Boolean).join(" • ") || "Sin marcar"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Foto recepción:</span><span className="font-semibold text-zinc-50">{files.intakePhotos[0]?.name ?? "Adjunta"}</span></div>
                          <div className="flex justify-between border-b border-sky-500/10 pb-2"><span className="text-zinc-400">Entrega:</span><span className="font-semibold text-orange-400">{dateLabel || "-"}</span></div>
                          <div className="flex justify-between"><span className="text-zinc-400">Costo estimado:</span><span className="font-semibold text-zinc-50">${Number(form.estimatedCost || 0).toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm text-zinc-300">Fecha promesa *</span>
                        <input value={form.promisedDate} onChange={(e) => onChange("promisedDate", e.target.value)} type="date" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none" />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm text-zinc-300">Costo estimado $</span>
                        <input value={form.estimatedCost} onChange={(e) => onChange("estimatedCost", e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none" />
                      </label>
                    </div>

                    <label className="space-y-2 block">
                      <span className="text-sm text-zinc-300">Notas adicionales (opcional)</span>
                      <input value={form.intakeNotes} onChange={(e) => onChange("intakeNotes", e.target.value)} placeholder="Ej: Cliente dejó funda, teléfono con contraseña..." className="w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500" />
                    </label>

                    <div className="flex justify-between">
                      <button type="button" onClick={() => setStep(2)} className="rounded-2xl border border-zinc-700 bg-slate-950 px-8 py-4 text-lg font-semibold text-zinc-100">
                        Atrás
                      </button>
                      <button type="button" disabled={!stepThreeComplete || saving} onClick={onSubmit} className="rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {saving ? "Guardando..." : "Continuar →"}
                      </button>
                    </div>
                  </section>
                ) : null}
              </div>
            </>
          ) : (
            <div className="mx-auto flex max-w-[700px] flex-col items-center rounded-[28px] border border-emerald-500/20 bg-slate-950/70 p-10 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/80 text-5xl text-white">✓</div>
              <h3 className="mt-8 text-3xl font-semibold text-sky-400">¡Orden Registrada!</h3>
              <p className="mt-3 text-zinc-400">El folio generado es:</p>
              <div className="mt-5 rounded-2xl border-2 border-orange-400 px-8 py-6 text-4xl font-bold tracking-[0.08em] text-orange-400">{successSummary.folio}</div>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => onCopy(successSummary.folio, "Folio")} className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white">Copiar folio</button>
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white">
                    Enviar por WhatsApp
                  </a>
                ) : null}
                {successSummary.pdfUrl ? (
                  <a href={successSummary.pdfUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-sky-500 px-5 py-3 font-semibold text-white">
                    Descargar PDF
                  </a>
                ) : null}
              </div>
              <p className="mt-6 text-sm text-zinc-400">Comparte este folio con el cliente para que pueda consultar el estado.</p>
              <button type="button" onClick={onResetFlow} className="mt-8 rounded-2xl bg-orange-500 px-8 py-4 text-lg font-semibold text-white">+ Nueva Orden</button>
            </div>
          )}

          {error ? <p className="mx-auto mt-4 max-w-[760px] rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
