"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  metadata?: Record<string, unknown>;
  actor_user_id?: string | null;
  created_at: string;
};

async function fetchAuditEvents(): Promise<AuditEvent[]> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
  if (!token) throw new Error("No session");

  const res = await fetch(`${apiBaseUrl}/v1/admin/audit-events?limit=50`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err.error || "API error");
  }

  const payload = await res.json();
  return payload.events ?? [];
}

export default function AuditoriaPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchAuditEvents()
      .then(setEvents)
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Auditoría interna</h1>
        <p className="muted">Últimos eventos de negocio por tenant.</p>
      </header>
      <div className="actions section">
        <Link href="/dashboard" className="secondary">Dashboard</Link>
        <Link href="/billing" className="secondary">Billing</Link>
        <Link href="/portal" className="secondary">Portal</Link>
      </div>
      {error ? <p>{error}</p> : null}
      <section className="table-wrap section">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Acción</th>
              <th>Recurso</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{new Date(event.created_at).toLocaleString()}</td>
                <td>{event.action}</td>
                <td>{event.resource_type}{event.resource_id ? ` · ${event.resource_id}` : ""}</td>
                <td><code>{JSON.stringify(event.metadata ?? {}, null, 0)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
