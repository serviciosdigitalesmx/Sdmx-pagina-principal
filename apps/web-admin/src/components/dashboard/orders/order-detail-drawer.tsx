"use client";

import { useState } from "react";
import { OrderTimeline } from "./order-timeline";
import { getTenantSlug } from "@/lib/tenant";

export type OrderDetailData = {
  order?: {
    id?: string;
    folio?: string;
    status?: string;
    receipt_url?: string | null;
    device_type?: string;
    device_model?: string;
    serial_number?: string | null;
    problem_description?: string;
    promised_date?: string | null;
    received_at?: string | null;
    created_at?: string;
    updated_at?: string;
    device_info?: Record<string, unknown>;
    metadata?: Record<string, unknown> | null;
    estimated_cost?: number;
    final_cost?: number;
    customer_id?: string | null;
    operational_risk?: {
      color?: 'green' | 'yellow' | 'red' | 'gray';
      reason?: string;
      suggested_action?: string;
      elapsed_minutes?: number | null;
      rule_applied?: string | null;
      priority?: number;
    };
  };
  checklist?: {
    has_charger?: boolean;
    screen_condition?: string | null;
    powers_on?: boolean;
    backup_required?: boolean;
    notes?: string | null;
    cosmetic_condition?: string | null;
    reported_physical_damage?: string | null;
    accessories_received?: string | null;
    customer_acceptance_required?: boolean;
    accepted_at?: string | null;
    accepted_by_name?: string | null;
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
    serialNumber?: string;
    issue?: string;
    promisedDate?: string;
  }) => Promise<void>;
  onEditChecklist: () => void;
  onArchive: () => void;
};

function buildTrackingUrl(customerPortalUrl?: string | null, folio?: string | null) {
  const publicBase = process.env.NEXT_PUBLIC_WEB_PUBLIC_URL?.replace(/\/$/, "") ?? "";
  const tenantSlug = getTenantSlug();
  const resolvedBase = customerPortalUrl || (publicBase && tenantSlug ? `${publicBase}/${encodeURIComponent(tenantSlug)}` : "");
  if (!resolvedBase) return "";
  const trimmed = resolvedBase.replace(/\/$/, "");
  const trackingUrl = trimmed.endsWith("/portal") ? trimmed.replace(/\/portal$/, "/tracking") : trimmed;
  const separator = trackingUrl.includes("?") ? "&" : "?";
  return `${trackingUrl}${folio ? `${separator}folio=${encodeURIComponent(folio)}` : ""}`;
}

function whatsappLink(phone?: string | null, folio?: string | null, customerPortalUrl?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const portalUrl = buildTrackingUrl(customerPortalUrl, folio);
  const message = encodeURIComponent(`Bienvenido a FIXI. Aquí puedes consultar el estatus de tu equipo: ${portalUrl}`);
  return `https://wa.me/${normalized}?text=${message}`;
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

function InlineField({
  label,
  value,
  field,
  editingField,
  drafts,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDraftChange,
  multiline = false,
}: {
  label: string;
  value: string;
  field: string;
  editingField: string | null;
  drafts: Record<string, string>;
  onStartEdit: (field: string, value: string) => void;
  onCancelEdit: (field: string, value: string) => void;
  onSave: (field: string) => Promise<void>;
  onDraftChange: (field: string, value: string) => void;
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
            <button type="button" onClick={() => void onSave(field)} className="rounded-md border border-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-100">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => onCancelEdit(field, value)}
              className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <InlineEditButton onClick={() => onStartEdit(field, value)} />
        )}
      </div>
      {editing ? (
        multiline ? (
          <textarea
            value={current}
            onChange={(e) => onDraftChange(field, e.target.value)}
            className="mt-3 w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
            rows={4}
          />
        ) : (
          <input
            value={current}
            onChange={(e) => onDraftChange(field, e.target.value)}
            className="mt-3 w-full rounded-2xl border border-sky-400/30 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none"
          />
        )
      ) : (
        <div className={`mt-2 ${multiline ? "rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3" : ""} text-sm text-zinc-200`}>{value || "Sin dato"}</div>
      )}
    </div>
  );
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

  if (!open) {
    return null;
  }

  const checklist = data?.checklist ?? null;
  const phone = (order?.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? null;
  const waLink = whatsappLink(phone, order?.folio, customerPortalUrl);
  const pdfUrl = order?.receipt_url ?? data?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ?? null;
  const portalUrl = buildTrackingUrl(customerPortalUrl, order?.folio);
  const metadataEntries = Object.entries((order?.metadata as Record<string, unknown> | undefined) ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  const operationalRisk = order?.operational_risk ?? null;

  function getDeviceInfoValue(key: "customer_name" | "customer_phone" | "customer_email" | "type" | "brand" | "model" | "serial_number") {
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
                : field === "serialNumber"
                  ? { serialNumber: value.trim() }
                  : field === "issue"
                    ? { issue: value.trim() }
                    : field === "promisedDate"
                      ? { promisedDate: value.trim() }
                      : {};
    await onEditDetails(payload);
    setEditingField(null);
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
          {operationalRisk ? (
            <div
              className={`max-w-sm rounded-2xl border px-3 py-2 text-xs font-semibold ${
                operationalRisk.color === 'red'
                  ? 'border-rose-500/25 bg-rose-500/10 text-rose-100'
                  : operationalRisk.color === 'yellow'
                    ? 'border-amber-500/25 bg-amber-500/10 text-amber-100'
                    : operationalRisk.color === 'gray'
                      ? 'border-zinc-500/25 bg-zinc-500/10 text-zinc-100'
                      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100'
              }`}
            >
              <div className="uppercase tracking-[0.2em] opacity-80">Riesgo operativo</div>
              <div className="mt-1 text-sm font-black">{operationalRisk.reason ?? 'Sin detalle'}</div>
              <div className="mt-1 opacity-80">{operationalRisk.suggested_action ?? 'Sin acción sugerida'}</div>
            </div>
          ) : null}
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
                      <InlineField
                        label="Cliente"
                        value={getDeviceInfoValue("customer_name")}
                        field="clientName"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Teléfono"
                        value={getDeviceInfoValue("customer_phone") || phone || ""}
                        field="clientPhone"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Correo"
                        value={getDeviceInfoValue("customer_email")}
                        field="clientEmail"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Equipo"
                        value={order?.device_model ?? getDeviceInfoValue("model") ?? ""}
                        field="deviceModel"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Tipo de dispositivo"
                        value={order?.device_type ?? getDeviceInfoValue("type") ?? ""}
                        field="deviceType"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Serie / IMEI"
                        value={order?.serial_number ?? getDeviceInfoValue("serial_number") ?? ""}
                        field="serialNumber"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
                      <InlineField
                        label="Problema"
                        value={order?.problem_description ?? ""}
                        field="issue"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                        multiline
                      />
                      {metadataEntries.length > 0 ? (
                        <div className="rounded-2xl border border-sky-500/15 bg-black/20 p-4">
                          <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Campos dinámicos</div>
                          <dl className="mt-3 grid gap-3">
                            {metadataEntries.map(([key, value]) => (
                              <div key={key} className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3">
                                <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">{key}</dt>
                                <dd className="mt-1 text-sm text-zinc-100">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      ) : null}
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
                      <InlineField
                        label="Fecha promesa"
                        value={order?.promised_date ? new Date(order.promised_date).toISOString().slice(0, 10) : ""}
                        field="promisedDate"
                        editingField={editingField}
                        drafts={drafts}
                        onStartEdit={(field, value) => {
                          setEditingField(field);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: currentDrafts[field] ?? value }));
                        }}
                        onCancelEdit={(field, value) => {
                          setEditingField(null);
                          setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }));
                        }}
                        onSave={saveField}
                        onDraftChange={(field, value) => setDrafts((currentDrafts) => ({ ...currentDrafts, [field]: value }))}
                      />
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Condición cosmética: {checklist?.cosmetic_condition ?? "Sin dato"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Daño físico: {checklist?.reported_physical_damage ?? "Sin dato"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Accesorios: {checklist?.accessories_received ?? "Sin dato"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">
                        <div className="mb-2 flex items-center justify-between">
                          <span>Aceptación: {checklist?.customer_acceptance_required ? checklist.accepted_by_name ?? "Requerida" : "No requerida"}</span>
                          <InlineEditButton onClick={onEditChecklist} />
                        </div>
                        {checklist?.accepted_at ? (
                          <div className="text-xs text-zinc-400">{new Date(checklist.accepted_at).toLocaleString("es-MX")}</div>
                        ) : null}
                      </div>
                    </div>
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
                      waLink ? "bg-sky-500/10 text-sky-100" : "pointer-events-none bg-zinc-800 text-zinc-500"
                    }`}
                    >
                      Enviar enlace por WhatsApp
                  </a>
                  {portalUrl ? (
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-sky-500/40 px-4 py-2 text-sm font-semibold text-sky-100"
                    >
                      Abrir seguimiento público
                    </a>
                  ) : null}
                  {pdfUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={onOpenPdf}
                        className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Ver PDF
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
