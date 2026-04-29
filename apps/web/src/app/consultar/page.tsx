"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Order = {
  folio: string;
  vehicle_plate: string;
  status: string;
  status_label?: string;
  checklist_items?: Array<{ label: string; checked: boolean; sort_order: number }>;
  reported_failure?: string;
  diagnosis?: string;
  public_notes?: string;
  photos_urls?: string[];
  settings?: {
    portal_title?: string;
    portal_subtitle?: string;
    portal_description?: string;
    pdf_ingreso_title?: string;
    pdf_diagnostico_title?: string;
    pdf_presupuesto_title?: string;
    pdf_entrega_title?: string;
  };
  customer?: { full_name: string; phone?: string };
  created_at?: string;
  promised_date?: string;
  completion_date?: string;
  delivery_date?: string;
  events?: Array<{ id: string; event_type: string; title: string; description?: string; metadata?: Record<string, unknown>; created_at: string }>;
  documents?: Array<{ document_type: string; public_url: string; created_at: string }>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ConsultarPage() {
  const [folio, setFolio] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryFolio = new URLSearchParams(window.location.search).get("folio");
    if (queryFolio) setFolio(queryFolio.toUpperCase());
  }, []);

  useEffect(() => {
    const queryFolio = new URLSearchParams(window.location.search).get("folio")?.trim();
    if (!queryFolio) return;
    const normalized = queryFolio.toUpperCase();
    setFolio(normalized);
    if (!apiBaseUrl) {
      setError("Missing NEXT_PUBLIC_API_BASE_URL");
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/v1/public/repair-orders/${normalized}`);
        if (!res.ok) throw new Error("No encontramos esa orden");
        setOrder(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    })();
  }, []);

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setOrder(null);
    if (!apiBaseUrl) {
      setError("Missing NEXT_PUBLIC_API_BASE_URL");
      return;
    }

    try {
      const res = await fetch(`${apiBaseUrl}/v1/public/repair-orders/${folio.trim().toUpperCase()}`);
      if (!res.ok) throw new Error("No encontramos esa orden");
      setOrder(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const shareUrl = typeof window === "undefined" || !order ? "" : `${window.location.origin}/consultar?folio=${folio.trim().toUpperCase()}`;
  const whatsappText = order
    ? encodeURIComponent(`Hola, tu orden ${folio} ya está registrada. Sigue tu avance aquí: ${shareUrl}`)
    : "";

  return (
    <main className="shell">
      <h1>{order?.settings?.portal_title || "Seguimiento de reparación"}</h1>
      <p className="muted">
        {order?.settings?.portal_description || "Puedes consultar directamente el folio precargado."}
      </p>
      <form className="toolbar section" onSubmit={search}>
        <input value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} placeholder="Folio" />
        <button type="submit">Consultar</button>
      </form>
      {error ? <p>{error}</p> : null}
      {order ? (
        <div className="card section stack">
          <strong>{order.customer?.full_name}</strong>
          <div className="muted">{order.customer?.phone || "-"}</div>
          <div className="card" style={{ borderColor: "rgba(255,255,255,.16)" }}>
            <strong>Estado</strong>
            <p style={{ color: statusTone(order.status) }}>{order.status_label || order.status}</p>
          </div>
          <div className="muted">Falla: {order.reported_failure || "-"}</div>
          <div className="muted">Diagnóstico: {order.diagnosis || "-"}</div>
          <div className="muted">Notas: {order.public_notes || "-"}</div>
          {order.checklist_items?.length ? (
            <div className="card">
              <strong>Checklist de ingreso</strong>
              <div className="stack" style={{ marginTop: 12 }}>
                {order.checklist_items.map((item) => (
                  <div key={`${item.sort_order}-${item.label}`} className="muted">
                    • [{item.checked ? "x" : " "}] {item.label}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {order.photos_urls?.length ? (
            <div className="cards">
              {order.photos_urls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="card">
                  <span className="muted">Foto</span>
                </a>
              ))}
            </div>
          ) : null}
          {order.documents?.length ? (
            <div className="cards">
              {order.documents.map((document) => (
                <a key={`${document.document_type}-${document.created_at}`} href={document.public_url} target="_blank" rel="noreferrer" className="card">
                  <strong>
                    {document.document_type === "ingreso" && order.settings?.pdf_ingreso_title
                      ? order.settings.pdf_ingreso_title
                      : document.document_type === "diagnostico" && order.settings?.pdf_diagnostico_title
                      ? order.settings.pdf_diagnostico_title
                      : document.document_type === "presupuesto" && order.settings?.pdf_presupuesto_title
                      ? order.settings.pdf_presupuesto_title
                      : document.document_type === "entrega" && order.settings?.pdf_entrega_title
                      ? order.settings.pdf_entrega_title
                      : document.document_type}
                  </strong>
                  <span className="muted">Descargar</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="actions">
              <a className="secondary" href={`${apiBaseUrl}/v1/public/repair-orders/${order.folio}/pdf?kind=ingreso`} target="_blank" rel="noreferrer">
                PDF ingreso
              </a>
            </div>
          )}
          <div className="card stack">
            <strong>Timeline</strong>
            {order.events?.length ? (
              order.events.map((event) => {
                const uploadedUrls = Array.isArray(event.metadata?.uploaded_urls) ? (event.metadata.uploaded_urls as string[]) : [];
                return (
                  <div key={event.id} className="card">
                    <strong>{event.title}</strong>
                    <div className="muted">{new Date(event.created_at).toLocaleString()}</div>
                    <div className="muted">{event.description || "-"}</div>
                    {uploadedUrls.length ? (
                      <div className="cards" style={{ marginTop: 12 }}>
                        {uploadedUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="card">
                            <span className="muted">Foto del evento</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : null}
          </div>
          <div className="actions">
            <a
              className="primary"
              href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, "") || ""}?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir en WhatsApp
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function statusTone(status: string) {
  if (status === "done") return "#34d399";
  if (status === "waiting_parts") return "#fbbf24";
  if (status === "canceled") return "#f87171";
  if (status === "in_progress") return "#60a5fa";
  return "#cbd5e1";
}
