"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Order = { id: string; folio: string; vehicle_plate: string; status: string; description: string; created_at: string };
type Technician = {
  id: string;
  full_name: string;
  active: boolean;
  workload?: { total: number; open: number; inProgress: number; done: number; waitingParts: number };
};

export default function TecnicoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
      );
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_BASE_URL");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("No session");
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, techniciansRes] = await Promise.all([
        fetch(`${apiBaseUrl}/v1/orders`, { headers }),
        fetch(`${apiBaseUrl}/v1/technicians`, { headers })
      ]);
      if (!ordersRes.ok) throw new Error("Failed to load orders");
      if (!techniciansRes.ok) throw new Error("Failed to load technicians");
      const [ordersData, techniciansData] = await Promise.all([ordersRes.json(), techniciansRes.json()]);
        setOrders(ordersData.orders ?? []);
        setTechnicians(techniciansData.technicians ?? []);
    })()
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Seguimiento Técnico</h1>
        <p className="muted">Órdenes vivas y disponibilidad de técnicos.</p>
      </header>
      {error ? <p>{error}</p> : null}
      <div className="grid-2 section">
        <section className="card stack">
          <h2>Técnicos</h2>
          {technicians.map((tech) => (
            <div key={tech.id} className="card">
              <strong>{tech.full_name}</strong>
              <div className="muted">{tech.active ? "Activo" : "Inactivo"}</div>
              <div className="muted">Total: {tech.workload?.total ?? 0} | Abiertas: {tech.workload?.open ?? 0} | En progreso: {tech.workload?.inProgress ?? 0}</div>
              <div className="muted">Listas: {tech.workload?.done ?? 0} | Esperando: {tech.workload?.waitingParts ?? 0}</div>
            </div>
          ))}
          {!technicians.length ? <div className="muted">No hay técnicos registrados.</div> : null}
        </section>
        <section className="card stack">
          <h2>Cola operativa</h2>
          {orders.slice(0, 8).map((order) => (
            <Link key={order.id} href={`/dashboard/orders/${order.folio}`} className="card">
              <strong>{order.folio}</strong>
              <div className="muted">{order.vehicle_plate}</div>
              <div className="muted">{order.status}</div>
              <div className="muted">{order.description}</div>
            </Link>
          ))}
          {!orders.length ? <div className="muted">No hay órdenes activas.</div> : null}
        </section>
      </div>
    </main>
  );
}
