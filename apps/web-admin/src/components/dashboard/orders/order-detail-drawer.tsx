"use client";

import { useState } from "react";
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
  onEditChecklist,
  onArchive,
}: Props) {
  const [activeTab, setActiveTab] = useState<"details" | "notes" | "checklist" | "history">("details");

  if (!open) {
    return null;
  }

  const order = data?.order;
  const checklist = data?.checklist ?? null;
  const phone = (order?.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? null;
  const waLink = whatsappLink(phone, order?.folio, customerPortalUrl);
  const pdfUrl = order?.receipt_url ?? data?.documents?.find((document) => document.file_type === "receipt_pdf" && document.public_url)?.public_url ?? null;
  const portalUrl = buildPortalUrl(customerPortalUrl, order?.folio);

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
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Cliente</div>
                        <div className="mt-2 text-lg font-semibold text-zinc-50">{(order?.device_info as { customer_name?: string } | undefined)?.customer_name ?? "Sin cliente"}</div>
                        <div className="mt-1 text-sm text-zinc-300">{phone ?? "Sin teléfono"}</div>
                        <div className="mt-1 text-sm text-zinc-300">{(order?.device_info as { customer_email?: string } | undefined)?.customer_email ?? "Sin correo"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Equipo</div>
                        <div className="mt-2 text-sm text-zinc-300">{order?.device_model ?? "Sin modelo"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Problema</div>
                        <div className="mt-2 rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-200">{order?.problem_description ?? "Sin descripción"}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Estado</div>
                        <div className="mt-2 text-sm font-semibold text-zinc-50">{order?.status ?? "Sin estado"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Costo / costo estimado</div>
                        <div className="mt-2 text-sm text-zinc-300">
                          ${Number(order?.estimated_cost ?? 0).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Folio</div>
                        <div className="mt-2 text-sm text-zinc-300">{order?.folio ?? "-"}</div>
                      </div>
                      <div className="grid gap-2 text-sm text-zinc-300">
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
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">Cargador: {checklist?.has_charger ? "Sí" : "No"}</div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">Pantalla: {checklist?.screen_condition ?? "Sin dato"}</div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">Enciende: {checklist?.powers_on ? "Sí" : "No"}</div>
                      <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-200">Respaldo: {checklist?.backup_required ? "Sí" : "No"}</div>
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
                  <button
                    type="button"
                    onClick={onEditFinancials}
                    className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-100"
                  >
                    Editar costo
                  </button>
                  <button
                    type="button"
                    onClick={onEditChecklist}
                    className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-100"
                  >
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
