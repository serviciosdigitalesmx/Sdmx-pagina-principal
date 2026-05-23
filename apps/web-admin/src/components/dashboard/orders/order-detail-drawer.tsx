"use client";

import { OrderTimeline } from "./order-timeline";

export type OrderDetailData = {
  order?: {
    id?: string;
    folio?: string;
    status?: string;
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
  onClose: () => void;
  onStatusChange: (status: string) => Promise<void>;
  onAddNote: () => Promise<void>;
};

function whatsappLink(phone?: string | null, folio?: string | null) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return null;
  const message = encodeURIComponent(`Hola, te contacto desde Sr. Fix sobre tu orden ${folio ?? ""}.`);
  return `https://wa.me/${normalized}?text=${message}`;
}

export function OrderDetailDrawer({ open, loading, data, onClose, onStatusChange, onAddNote }: Props) {
  if (!open) {
    return null;
  }

  const order = data?.order;
  const phone = (order?.device_info as { customer_phone?: string } | undefined)?.customer_phone ?? null;
  const waLink = whatsappLink(phone, order?.folio);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-slate-50 shadow-[0_24px_90px_rgba(15,23,42,0.2)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#245a82]">Detalle operativo</p>
            <h3 className="text-xl font-semibold text-slate-950">{order?.folio ?? "Orden"}</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600">
            Cerrar
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Cargando detalle...</div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Cliente</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{(order?.device_info as { customer_name?: string } | undefined)?.customer_name ?? "Sin cliente"}</div>
                <div className="mt-1 text-sm text-slate-600">{phone ?? "Sin teléfono"}</div>
                <div className="mt-1 text-sm text-slate-600">{(order?.device_info as { customer_email?: string } | undefined)?.customer_email ?? "Sin correo"}</div>
              </div>
              <div className="grid gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Estado</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{order?.status ?? "Sin estado"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Equipo</div>
                  <div className="mt-2 text-sm text-slate-700">{order?.device_model ?? "Sin modelo"}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Problema</div>
                  <div className="mt-2 text-sm text-slate-700">{order?.problem_description ?? "Sin descripción"}</div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Acciones</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onStatusChange("diagnostico")}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Diagnóstico
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange("reparacion")}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Reparación
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange("listo")}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => onStatusChange("entregado")}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Entregada
                  </button>
                  <button
                    type="button"
                    onClick={onAddNote}
                    className="rounded-full bg-[#2c6e9f] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Agregar nota
                  </button>
                  <a
                    href={waLink ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!waLink}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      waLink ? "bg-[#1b9e5e] text-white" : "pointer-events-none bg-slate-200 text-slate-400"
                    }`}
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-slate-600">
                <div>Folio: {order?.folio ?? "-"}</div>
                <div>Creada: {order?.created_at ? new Date(order.created_at).toLocaleString("es-MX") : "-"}</div>
                <div>Actualizada: {order?.updated_at ? new Date(order.updated_at).toLocaleString("es-MX") : "-"}</div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Archivos</h4>
              <div className="mt-4 space-y-3">
                {(data?.documents ?? []).length > 0 ? (
                  data?.documents?.map((document) => (
                    <a
                      key={document.id ?? document.file_name}
                      href={document.public_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                    >
                      <span>{document.file_name ?? "Documento"}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{document.file_type ?? ""}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Sin archivos.</p>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#245a82]">Timeline</h4>
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
