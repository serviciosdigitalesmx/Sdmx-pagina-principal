"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

type PortalOrder = {
  folio: string;
  status: string;
  status_label?: string;
  reported_failure?: string;
  diagnosis?: string;
  public_notes?: string;
  checklist_items?: Array<{ label: string; checked: boolean; sort_order: number }>;
  customer?: { full_name: string; phone?: string };
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
  events?: Array<{
    id: string;
    event_type: string;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    created_at: string;
  }>;
  documents?: Array<{ document_type: string; public_url: string; created_at: string }>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function PortalPage() {
  const [folio, setFolio] = useState("");
  const [order, setOrder] = useState<PortalOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const queryFolio = new URLSearchParams(window.location.search).get("folio");
    if (queryFolio) {
      setFolio(queryFolio.toUpperCase());
    }
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

  const shareUrl = typeof window === "undefined" || !order ? "" : `${window.location.origin}/portal?folio=${folio.trim().toUpperCase()}`;

  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>{order?.settings?.portal_title || "Rastreo de Orden"}</h1>
        <p className="muted">{order?.settings?.portal_subtitle || "Consulta pública por folio."}</p>
        {order?.settings?.portal_description ? <p className="lede">{order.settings.portal_description}</p> : null}
      </header>
      <form className="toolbar section" onSubmit={search}>
        <input value={folio} onChange={(e) => setFolio(e.target.value.toUpperCase())} placeholder="Folio" />
        <button type="submit">Buscar</button>
      </form>
      {error ? <p>{error}</p> : null}
      {order ? (
        <div className="card stack section">
          <strong>{order.customer?.full_name}</strong>
          <div className="muted">{order.customer?.phone || "-"}</div>
          <div className="card" style={{ borderColor: statusTone(order.status) }}>
            <strong>Estado</strong>
            <p style={{ color: statusTone(order.status) }}>{order.status_label || order.status}</p>
          </div>
          <div className="muted">Falla: {order.reported_failure || "-"}</div>
          <div className="muted">Diagnóstico: {order.diagnosis || "-"}</div>
          <div className="muted">Notas públicas: {order.public_notes || "-"}</div>
          {order.checklist_items?.length ? (
            <div className="card stack">
              <strong>Checklist</strong>
              {order.checklist_items.map((item) => (
                <div key={`${item.sort_order}-${item.label}`} className="muted">
                  • [{item.checked ? "x" : " "}] {item.label}
                </div>
              ))}
            </div>
          ) : null}
          <div className="cards">
            {order.documents?.length ? (
              order.documents.map((document) => (
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
                  <div className="muted">PDF generado</div>
                </a>
              ))
            ) : (
              <>
                <a className="card" href={`${apiBaseUrl}/v1/public/repair-orders/${order.folio}/pdf?kind=ingreso`} target="_blank" rel="noreferrer">
                  <strong>{order.settings?.pdf_ingreso_title || "PDF ingreso"}</strong>
                  <div className="muted">Descargar documento</div>
                </a>
                <a className="card" href={`${apiBaseUrl}/v1/public/repair-orders/${order.folio}/pdf?kind=diagnostico`} target="_blank" rel="noreferrer">
                  <strong>{order.settings?.pdf_diagnostico_title || "PDF diagnóstico"}</strong>
                  <div className="muted">Descargar documento</div>
                </a>
              </>
            )}
          </div>
          <div className="card stack">
            <strong>Timeline</strong>
            {order.events?.length ? (
              order.events.map((event) => {
                const uploadedUrls = Array.isArray(event.metadata?.uploaded_urls) ? event.metadata?.uploaded_urls as string[] : [];
                return (
                  <div key={event.id} className="card">
                    <strong>{event.title}</strong>
                    <div className="muted">{new Date(event.created_at).toLocaleString()}</div>
                    <div className="muted">{event.description || "-"}</div>
                    {uploadedUrls.length ? (
                      <div className="cards" style={{ marginTop: 12 }}>
                        {uploadedUrls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer" className="card">
                            <span className="muted">Foto</span>
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="muted">Sin eventos aún.</p>
            )}
          </div>
          <div className="actions">
            <a className="primary" href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(`Hola, tu orden ${order.folio} ya está registrada. Sigue tu avance aquí: ${shareUrl}`)}`} target="_blank" rel="noreferrer">
              Abrir WhatsApp
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
