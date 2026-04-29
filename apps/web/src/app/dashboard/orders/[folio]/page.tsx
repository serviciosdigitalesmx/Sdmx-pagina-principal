"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "next/navigation";
import { apiDownload, apiFetch, apiUpload, DashboardHeader } from "../../../../lib/runtime.js";
import { compressImageFile } from "../../../../lib/image.js";

type Order = {
  folio: string;
  status: string;
  device_type?: string;
  device_brand?: string;
  device_model?: string;
  accessories?: string;
  vehicle_plate: string;
  reported_failure?: string;
  diagnosis?: string;
  internal_notes?: string;
  public_notes?: string;
  estimated_cost?: number;
  final_cost?: number;
  technician_id?: string;
  promised_date?: string;
  completion_date?: string;
  delivery_date?: string;
  payment_registered?: boolean;
  photos_urls?: string[];
  checklist_items?: Array<{ id: string; label: string; checked: boolean; sort_order: number }>;
  customer?: { full_name: string; phone?: string; email?: string; address?: string };
};

type Technician = { id: string; full_name: string; active: boolean };
type ChecklistItemForm = { id?: string; label: string; checked: boolean; sortOrder: number };

type OrderEvent = {
  id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
};

export default function OrderDetailPage() {
  const params = useParams<{ folio: string }>();
  const folio = params.folio;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [notification, setNotification] = useState<{ whatsapp_url: string; message: string; status_changed: boolean } | null>(null);
  const [form, setForm] = useState({
    status: "",
    reportedFailure: "",
    diagnosis: "",
    internalNotes: "",
    publicNotes: "",
    estimatedCost: "",
    finalCost: "",
    technicianId: "",
    promisedDate: "",
    completionDate: "",
    deliveryDate: "",
    paymentRegistered: false,
    vehiclePlate: "",
    checklistItems: [] as ChecklistItemForm[]
  });
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const load = async () => {
    const [orderData, eventsData] = await Promise.all([
      apiFetch(`/v1/orders/${folio}`),
      apiFetch(`/v1/orders/${folio}/events`)
    ]);
    setOrder(orderData.order);
    setEvents(eventsData.events ?? []);
    setForm({
      status: orderData.order.status ?? "",
      reportedFailure: orderData.order.reported_failure ?? "",
      diagnosis: orderData.order.diagnosis ?? "",
      internalNotes: orderData.order.internal_notes ?? "",
      publicNotes: orderData.order.public_notes ?? "",
      estimatedCost: orderData.order.estimated_cost?.toString() ?? "",
      finalCost: orderData.order.final_cost?.toString() ?? "",
      technicianId: orderData.order.technician_id ?? "",
      promisedDate: orderData.order.promised_date ?? "",
      completionDate: orderData.order.completion_date ?? "",
      deliveryDate: orderData.order.delivery_date ?? "",
      paymentRegistered: Boolean(orderData.order.payment_registered),
      vehiclePlate: orderData.order.vehicle_plate ?? "",
      checklistItems: Array.isArray(orderData.order.checklist_items)
        ? orderData.order.checklist_items.map((item: { id: string; label: string; checked: boolean; sort_order: number }) => ({
          id: item.id,
          label: item.label,
          checked: Boolean(item.checked),
          sortOrder: item.sort_order
        }))
        : []
    });
  };

  useEffect(() => {
    void load().catch((err) => setError(err.message));
    void apiFetch("/v1/technicians")
      .then((data) => setTechnicians(data.technicians ?? []))
      .catch((err) => console.error(err));
  }, [folio]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        status: form.status || undefined,
        reportedFailure: form.reportedFailure || undefined,
        diagnosis: form.diagnosis || undefined,
        internalNotes: form.internalNotes || undefined,
        publicNotes: form.publicNotes || undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        finalCost: form.finalCost ? Number(form.finalCost) : undefined,
        technicianId: form.technicianId || null,
        promisedDate: form.promisedDate || null,
        completionDate: form.completionDate || null,
        deliveryDate: form.deliveryDate || null,
        paymentRegistered: form.paymentRegistered,
        vehiclePlate: form.vehiclePlate || undefined,
        checklistItems: form.checklistItems
      };
      const response = await apiFetch(`/v1/orders/${folio}`, { method: "PATCH", body: JSON.stringify(payload) });
      setNotification(response.notification ?? null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title={`Orden ${folio}`} subtitle="Detalle operativo y edición rica." />
      {notification?.status_changed ? (
        <div className="card section stack">
          <strong>{notification.status_changed ? "Automatización de estado lista" : "Notificación preparada"}</strong>
          <p className="muted">{notification.message}</p>
          {notification.whatsapp_url ? (
            <a className="primary" href={notification.whatsapp_url} target="_blank" rel="noreferrer">Abrir WhatsApp precargado</a>
          ) : null}
        </div>
      ) : null}
      {order ? (
        <div className="cards section">
          <div className="card">
            <strong>Semáforo</strong>
            <p style={{ color: statusTone(order.status) }}>{statusLabel(order.status)}</p>
          </div>
          <div className="card">
            <strong>Dispositivo</strong>
            <p>{[order.device_type, order.device_brand, order.device_model].filter(Boolean).join(" ") || "-"}</p>
          </div>
          <div className="card">
            <strong>Accesorios</strong>
            <p>{order.accessories || "-"}</p>
          </div>
        </div>
      ) : null}
      {error ? <p>{error}</p> : null}
      {order ? (
        <form className="grid-2 section" onSubmit={submit}>
          <div className="card stack">
            <h2>Datos base</h2>
            <input value={form.vehiclePlate} onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })} placeholder="Placa" />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="open">Abierta</option>
              <option value="in_progress">En progreso</option>
              <option value="waiting_parts">Esperando refacción</option>
              <option value="done">Lista</option>
              <option value="canceled">Cancelada</option>
            </select>
            <input value={form.reportedFailure} onChange={(e) => setForm({ ...form, reportedFailure: e.target.value })} placeholder="Falla reportada" />
            <input value={form.promisedDate} onChange={(e) => setForm({ ...form, promisedDate: e.target.value })} placeholder="Fecha promesa" type="date" />
            <input value={form.completionDate} onChange={(e) => setForm({ ...form, completionDate: e.target.value })} placeholder="Fecha finalización" type="datetime-local" />
            <input value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} placeholder="Fecha entrega" type="datetime-local" />
            <div className="card stack">
              <h3>Checklist de ingreso</h3>
              {form.checklistItems.map((item, index) => (
                <div key={item.id ?? `${item.label}-${index}`} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        checklistItems: form.checklistItems.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, checked: e.target.checked } : entry
                        )
                      });
                    }}
                  />
                  <input
                    value={item.label}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        checklistItems: form.checklistItems.map((entry, entryIndex) =>
                          entryIndex === index ? { ...entry, label: e.target.value } : entry
                        )
                      });
                    }}
                  />
                  <button type="button" onClick={() => setForm({ ...form, checklistItems: form.checklistItems.filter((_, i) => i !== index) })}>
                    X
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    checklistItems: [...form.checklistItems, { label: "Nuevo ítem", checked: false, sortOrder: form.checklistItems.length }]
                  })
                }
              >
                + Agregar ítem
              </button>
            </div>
          </div>
          <div className="card stack">
            <h2>Diagnóstico y cobro</h2>
            <textarea rows={3} value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} placeholder="Diagnóstico" />
            <textarea rows={3} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} placeholder="Notas internas" />
            <textarea rows={3} value={form.publicNotes} onChange={(e) => setForm({ ...form, publicNotes: e.target.value })} placeholder="Notas públicas" />
            <select value={form.technicianId} onChange={(e) => setForm({ ...form, technicianId: e.target.value })}>
              <option value="">Sin técnico asignado</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.full_name}{tech.active ? "" : " (inactivo)"}
                </option>
              ))}
            </select>
            <input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} placeholder="Costo estimado" />
            <input type="number" value={form.finalCost} onChange={(e) => setForm({ ...form, finalCost: e.target.value })} placeholder="Costo final" />
            <label className="muted" style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={form.paymentRegistered} onChange={(e) => setForm({ ...form, paymentRegistered: e.target.checked })} />
              Pago registrado
            </label>
          </div>
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2>Cliente</h2>
            <p>{order.customer?.full_name}</p>
            <p className="muted">{order.customer?.phone || "-"}</p>
            <p className="muted">{order.customer?.email || "-"}</p>
            <p className="muted">{order.customer?.address || "-"}</p>
          </div>
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2>Fotos</h2>
            <div className="toolbar section">
              <input type="file" accept="image/*" multiple onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))} />
              <button
                type="button"
                disabled={uploading}
                onClick={async () => {
                  if (!photoFiles.length) return;
                  setUploading(true);
                  setError(null);
                  try {
                    const compressedFiles = await Promise.all(photoFiles.map((file) => compressImageFile(file)));
                    const formData = new FormData();
                    compressedFiles.forEach((file) => formData.append("photos", file));
                    await apiUpload(`/v1/orders/${folio}/photos`, formData);
                    setPhotoFiles([]);
                    await load();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Error");
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? "Subiendo..." : "Subir fotos"}
              </button>
            </div>
            {order.photos_urls?.length ? (
              <div className="cards">
                {order.photos_urls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="card">
                    <span className="muted">{url}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="muted">Sin fotos cargadas.</p>
            )}
          </div>
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2>Timeline</h2>
            <div className="stack">
              {events.map((event) => (
                <div key={event.id} className="card">
                  <strong>{event.title}</strong>
                  <div className="muted">{new Date(event.created_at).toLocaleString()}</div>
                  <div className="muted">{event.description || "-"}</div>
                  {Array.isArray(event.metadata?.uploaded_urls) ? (
                    <div className="cards" style={{ marginTop: 12 }}>
                      {(event.metadata.uploaded_urls as string[]).map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer" className="card">
                          <span className="muted">Foto del evento</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!events.length ? <p className="muted">Sin eventos aún.</p> : null}
            </div>
          </div>
          <div className="actions" style={{ gridColumn: "1 / -1" }}>
            <button type="button" onClick={() => apiDownload(`/v1/orders/pdf/${folio}?kind=ingreso`, `orden-${folio}-ingreso.pdf`)} className="secondary">PDF ingreso</button>
            <button type="button" onClick={() => apiDownload(`/v1/orders/pdf/${folio}?kind=diagnostico`, `orden-${folio}-diagnostico.pdf`)} className="secondary">PDF diagnóstico</button>
            <button type="button" onClick={() => apiDownload(`/v1/orders/pdf/${folio}?kind=presupuesto`, `orden-${folio}-presupuesto.pdf`)} className="secondary">PDF presupuesto</button>
            <button type="button" onClick={() => apiDownload(`/v1/orders/pdf/${folio}?kind=entrega`, `orden-${folio}-entrega.pdf`)} className="secondary">PDF entrega</button>
            <button type="submit">Guardar cambios</button>
          </div>
        </form>
      ) : null}
    </main>
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Abierta",
    in_progress: "En progreso",
    waiting_parts: "Esperando refacción",
    done: "Lista",
    canceled: "Cancelada"
  };
  return map[status] ?? status;
}

function statusTone(status: string) {
  if (status === "done") return "#34d399";
  if (status === "waiting_parts") return "#fbbf24";
  if (status === "canceled") return "#f87171";
  if (status === "in_progress") return "#60a5fa";
  return "#cbd5e1";
}
