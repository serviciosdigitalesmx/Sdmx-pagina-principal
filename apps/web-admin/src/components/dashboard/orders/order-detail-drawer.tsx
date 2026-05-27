"use client";

import { useEffect, useState } from "react";
import { OrderTimeline } from "./order-timeline";

export type OrderDetailData = {
  order?: {
    id?: string;
    folio?: string;
    status?: string;
    receipt_url?: string | null;
    device_type?: string;
    device_model?: string;
    problem_description?: string;
    promised_date?: string | null;
    received_at?: string | null;
    created_at?: string;
    updated_at?: string;
    device_info?: Record<string, unknown>;
    estimated_cost?: number;
    final_cost?: number;
    customer_id?: string | null;
  };
  checklist?: {
    has_charger?: boolean;
    screen_condition?: string | null;
    powers_on?: boolean;
    backup_required?: boolean;
    notes?: string | null;
  } | null;
  documents?: Array<{
    id?: string;
    file_name?: string;
    file_type?: string;
    public_url?: string | null;
    mime_type?: string | null;
    created_at?: string;
  }>;
  events?: Array<{
    id?: string;
    event_type?: string;
    previous_status?: string | null;
    new_status?: string | null;
    note?: string | null;
    actor_name?: string | null;
    created_at?: string;
  }>;
};

type Props = {
  open: boolean;
  loading: boolean;
  data: OrderDetailData | null;
  customerPortalUrl: string | null;
  statusOptions?: Array<{ key: string; label: string }>;
  onClose: () => void;
  onStatusChange: (status: string) => Promise<void>;
  onAddNote: () => Promise<void>;
  onCopyFolio: () => void;
  onOpenPdf: () => void;
  onPrintReceipt: () => void;
  onEditFinancials: () => void;
  onEditDetails: (payload: {
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    deviceType?: string;
    deviceModel?: string;
    issue?: string;
    promisedDate?: string;
  }) => Promise<void>;
  onEditChecklist: () => void;
  onArchive: () => void;
};

function buildPortalUrl(customerPortalUrl?: string | null, folio?: string | null) {
  if (!customerPortalUrl) return "";
  const separator = customerPortalUrl.includes("?") ? "&" : "?";
  return `${customerPortalUrl}${folio ? `${separator}folio=${encodeURIComponent(folio)}` : ""}`;
}

function whatsappLink(phone?: string | null, folio?: string | null, customerPortalUrl?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const portalUrl = buildPortalUrl(customerPortalUrl, folio);
  const message = encodeURIComponent(`Bienvenido a Marca Blanca. Aquí puedes consultar el estatus de tu equipo: ${portalUrl}`);
  return `https://wa.me/${normalized}?text=${message}`;
}

export function OrderDetailDrawer({
  open,
  loading,
  data,
  customerPortalUrl,
  statusOptions,
  onClose,
  onStatusChange,
  onAddNote,
  onCopyFolio,
  onOpenPdf,
  onPrintReceipt,
  onEditFinancials,
  onEditDetails,
  onEditChecklist,
  onArchive,
}: Props) {
  const order = data?.order;
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "checklist" | "history">("details");
  const [editingField, setEditingField] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [portalFullscreen, setPortalFullscreen] = useState(false);
  const portalWrapId = `portal-preview-${order?.id ?? "unknown"}`;

  useEffect(() => {
    setEditingField(null);
    setDrafts({});
  }, [order?.id]);

  useEffect(() => {
    const onChange = () => {
      setPortalFullscreen(document.fullscreenElement?.id === portalWrapId);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && document.fullscreenElement) {
        void document.exitFullscreen().catch(() => undefined);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [portalWrapId]);

  if (!open) {
    return null;
  }

  const checklist = data?.checklist ?? null;
  const phone = (order?.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? null;
  const waLink = whatsappLink(phone, order?.folio, customerPortalUrl);
  const pdfUrl = order?.receipt_url ?? data?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ?? null;
  const portalUrl = buildPortalUrl(customerPortalUrl, order?.folio);

  function getDeviceInfoValue(key: "customer_name" | "customer_phone" | "customer_email" | "type" | "brand" | "model") {
    return String((order?.device_info as Record<string, unknown> | undefined)?.[key] ?? "");
  }

  async function saveField(field: string) {
    if (!order?.id) return;
    const value = drafts[field] ?? "";
    const payload =
      field === "clientName"
        ? { clientName: value.trim() }
        : field === "clientPhone"
          ? { clientPhone: value.trim() }
          : field === "clientEmail"
            ? { clientEmail: value.trim() }
            : field === "deviceType"
              ? { deviceType: value.trim() }
              : field === "deviceModel"
                ? { deviceModel: value.trim() }
                : field === "issue"
                  ? { issue: value.trim() }
                  : field === "promisedDate"
                    ? { promisedDate: value.trim() }
                    : {};
    await onEditDetails(payload);
    setEditingField(null);
  }

  function InlineEditButton({ onClick }: { onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-500/25 bg-slate-950 text-sky-100 transition hover:bg-sky-500/10"
        aria-label="Editar campo"
      >
        <span className="text-xs font-black">✎</span>
      </button>
    );
  }

  async function togglePortalFullscreen() {
    const element = document.getElementById(portalWrapId);
    if (!element) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
      return;
    }
    await element.requestFullscreen().catch(() => undefined);
  }

  function InlineField({
    label,
    value,
    field,
    multiline = false,
  }: {
    label: string;
    value: string;
    field: string;
    multiline?: boolean;
  }) {
    const editing = editingField === field;
    const current = drafts[field] ?? value;

    return (
      <div className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{label}</div>
          {editing ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => void saveField(field)} className="rounded-md border border-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-100">
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingField(null);
                  setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                }}
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <InlineEditButton
              onClick={() => {
                setEditingField(field);
                setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
              }}
            />
          )}
        </div>
        {editing ? (
          multiline ? (
            <textarea
              value={current}
              onChange={(e) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: e.target.value }))}
              className="mt-3 w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
              rows={4}
            />
          ) : (
            <input
              value={current}
              onChange={(e) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: e.target.value }))}
              className="mt-3 w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
            />
          )
        ) : (
          <div className={`mt-2 ${multiline ? "rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3" : ""} text-sm text-zinc-200`}>{value || "Sin dato"}</div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-[linear-gradient(180deg,rgba(16,14,12,0.98),rgba(14,13,12,0.96))] text-zinc-100 shadow-[0_24px_90px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between border-b border-amber-700/15 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-100/70">Recepción profesional</p>
            <h3 className="text-xl font-semibold text-zinc-50">{order?.folio ?? "Orden"}</h3>
            <p className="mt-1 text-sm text-zinc-400">Detalles operativos · timeline · archivos · acciones.</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
            Salir
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-zinc-400">Cargando detalle...</div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            <div className="rounded-2xl border border-sky-500/20 bg-slate-950/70">
              <div className="flex flex-wrap gap-0 border-b border-sky-500/20 text-sm font-semibold">
                {[
                  { key: "details", label: "Detalles" },
                  { key: "notes", label: "Notas internas" },
                  { key: "checklist", label: "Checklist recepción" },
                  { key: "history", label: "Historial" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-3 transition ${
                      activeTab === tab.key
                        ? "border-b-2 border-sky-400 text-sky-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="space-y-5 p-5">
                {activeTab === "details" ? (
                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                      <InlineField label="Cliente" value={getDeviceInfoValue("customer_name")} field="clientName" />
                      <InlineField label="Teléfono" value={getDeviceInfoValue("customer_phone") || phone || ""} field="clientPhone" />
                      <InlineField label="Correo" value={getDeviceInfoValue("customer_email")} field="clientEmail" />
                      <InlineField label="Equipo" value={order?.device_model ?? getDeviceInfoValue("model") ?? ""} field="deviceModel" />
                      <InlineField label="Tipo de dispositivo" value={order?.device_type ?? getDeviceInfoValue("type") ?? ""} field="deviceType" />
                      <InlineField label="Problema" value={order?.problem_description ?? ""} field="issue" multiline />
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Estado</div>
                          <button type="button" onClick={() => onStatusChange(order?.status ?? "recibido")} className="rounded-md border border-sky-500/25 px-3 py-1 text-xs font-semibold text-sky-100">
                            Editar
                          </button>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-zinc-50">{order?.status ?? "Sin estado"}</div>
                      </div>
                      <div className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Costo / costo estimado</div>
                          <InlineEditButton onClick={onEditFinancials} />
                        </div>
                        <div className="mt-2 text-sm text-zinc-300">${Number(order?.estimated_cost ?? 0).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Folio</div>
                          <InlineEditButton onClick={onCopyFolio} />
                        </div>
                        <div className="mt-2 text-sm text-zinc-300">{order?.folio ?? "-"}</div>
                      </div>
                      <InlineField label="Fecha promesa" value={order?.promised_date ? new Date(order.promised_date).toISOString().slice(0, 10) : ""} field="promisedDate" />
                      <div className="grid gap-2 rounded-2xl border border-sky-500/15 bg-black/20 p-4 text-sm text-zinc-300">
                        <div>Creada: {order?.created_at ? new Date(order.created_at).toLocaleString("es-MX") : "-"}</div>
                        <div>Actualizada: {order?.updated_at ? new Date(order.updated_at).toLocaleString("es-MX") : "-"}</div>
                      </div>
                    </div>
                  </section>
                ) : null}

                {activeTab === "notes" ? (
                  <section className="space-y-3">
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-300">
                      Sin editor de notas en esta vista. Las notas se agregan desde la acción superior.
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Seguimiento visible al cliente</div>
                      <div className="mt-2 text-sm text-zinc-200">{order?.problem_description ?? "Sin seguimiento"}</div>
                    </div>
                  </section>
                ) : null}

                {activeTab === "checklist" ? (
                  <section className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Cargador: {checklist?.has_charger ? "Sí" : "No"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Pantalla: {checklist?.screen_condition ?? "Sin dato"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Enciende: {checklist?.powers_on ? "Sí" : "No"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Respaldo: {checklist?.backup_required ? "Sí" : "No"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">Notas: {checklist?.notes ?? "Sin notas"}</div>
                  </section>
                ) : null}

                {activeTab === "history" ? (
                  <section>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Últimos movimientos</h4>
                    <div className="mt-3">
                      <OrderTimeline events={data?.events ?? []} />
                    </div>
                  </section>
                ) : null}
              </div>
            </div>

            {order ? (
              <section className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Portal interno del cliente</h4>
                    <p className="mt-1 text-sm text-zinc-400">Vista nativa sin iframe, con fullscreen y Escape.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void togglePortalFullscreen()}
                    className="rounded-full border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-100"
                  >
                    {portalFullscreen ? "Salir de full screen" : "Full screen"}
                  </button>
                </div>
                <div
                  id={portalWrapId}
                  className="overflow-hidden rounded-2xl border border-sky-500/20 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(226,232,240,0.96))] text-slate-900"
                >
                  <div className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 px-5 py-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Portal del cliente</p>
                        <h5 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 [font-family:var(--font-display)]">
                          Consulta real de reparación
                        </h5>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                          Vista interna para consultar la orden sin depender del navegador ni de políticas externas del portal.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Folio</p>
                        <p className="mt-1 text-lg font-bold text-slate-950">{order.folio ?? "-"}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                      <article className="rounded-3xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Orden encontrada</p>
                            <h6 className="mt-2 text-2xl font-bold text-slate-950">{order.folio ?? "Sin folio"}</h6>
                          </div>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                            {order.status ?? "Sin estado"}
                          </span>
                        </div>

                        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Cliente</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-950">{getDeviceInfoValue("customer_name") || "Sin cliente"}</dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Equipo</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-950">{order.device_model ?? "Sin equipo"}</dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Falla reportada</dt>
                            <dd className="mt-1 text-sm leading-6 text-slate-700">{order.problem_description ?? "Sin descripción"}</dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Ingreso</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-950">{order.created_at ? new Date(order.created_at).toLocaleString("es-MX") : "Sin fecha"}</dd>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Costo</dt>
                            <dd className="mt-1 text-sm font-semibold text-slate-950">${Number(order.estimated_cost ?? 0).toFixed(2)}</dd>
                          </div>
                        </dl>
                      </article>

                      <aside className="space-y-4">
                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Timeline</p>
                          <div className="mt-4 space-y-3">
                            {(data?.events ?? []).slice(0, 5).map((event) => (
                              <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="font-semibold text-slate-950">{event.event_type}</span>
                                  <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{event.created_at ? new Date(event.created_at).toLocaleString("es-MX") : "-"}</span>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{event.note ?? "Sin nota"}</p>
                              </div>
                            ))}
                            {(data?.events ?? []).length === 0 ? <p className="text-sm text-slate-500">Sin eventos.</p> : null}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-5">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WhatsApp del taller</p>
                          <p className="mt-2 text-sm text-slate-700">{phone ?? "Sin teléfono registrado"}</p>
                        </div>
                      </aside>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Acciones</h4>
                <div className="flex flex-wrap gap-2">
                  {(statusOptions ?? [
                    { key: "diagnostico", label: "Diagnóstico" },
                    { key: "reparacion", label: "Reparación" },
                    { key: "listo", label: "Lista" },
                    { key: "entregado", label: "Entregada" },
                  ]).map((status) => (
                    <button
                      key={status.key}
                      type="button"
                      onClick={() => onStatusChange(status.key)}
                      className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
                    >
                      {status.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={onAddNote}
                    className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-zinc-950"
                  >
                    Agregar nota
                  </button>
                  <button
                    type="button"
                    onClick={onCopyFolio}
                    className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
                  >
                    Copiar folio
                  </button>
                    <button type="button" onClick={() => setEditingField("clientName")} className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-100">
                      Editar ficha
                    </button>
                    <button type="button" onClick={onEditFinancials} className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-100">
                      Editar costo
                    </button>
                    <button type="button" onClick={onEditChecklist} className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-100">
                      Editar checklist
                    </button>
                  {order?.status !== "entregado" ? (
                    <button
                      type="button"
                      onClick={onArchive}
                      className="rounded-full border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-100"
                    >
                      Enviar a archivo
                    </button>
                  ) : null}
                  <a
                    href={waLink ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!waLink}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      waLink ? "bg-amber-500/10 text-amber-100" : "pointer-events-none bg-zinc-800 text-zinc-500"
                    }`}
                    >
                      WhatsApp
                    </a>
                  {portalUrl ? (
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-100"
                    >
                      Abrir portal cliente
                    </a>
                  ) : null}
                  {pdfUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={onOpenPdf}
                        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Ver cotización PDF
                      </button>
                      <button
                        type="button"
                        onClick={onPrintReceipt}
                        className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200"
                      >
                        Imprimir / Guardar PDF
                      </button>
                    </>
                  ) : (
                    <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-500">
                      PDF pendiente
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Archivos</h4>
              <div className="mt-4 space-y-3">
                {(data?.documents ?? []).length > 0 ? (
                  data?.documents?.map((document) => (
                    <a
                      key={document.id ?? document.file_name}
                      href={document.public_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm text-zinc-200"
                    >
                      <span>{document.file_name ?? "Documento"}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">{document.file_type ?? ""}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">Sin archivos.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100/70">Timeline</h4>
              <div className="mt-4">
                <OrderTimeline events={data?.events ?? []} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
