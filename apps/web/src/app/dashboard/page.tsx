"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/runtime.js";

type Order = {
  id: string;
  folio: string;
  vehicle_plate: string;
  description: string;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [billing, setBilling] = useState<{ storage?: { usedBytes?: number; limitBytes?: number | null; percentUsed?: number | null; warning?: boolean; blocked?: boolean } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch("/v1/orders")
      .then((data) => setOrders(data.orders ?? []))
      .catch((err) => setError(err.message));
    void apiFetch("/v1/billing/status")
      .then((data) => setBilling(data))
      .catch(() => void 0);
  }, []);

  return (
    <main className="shell">
      <h1>Dashboard</h1>
      <p>Protegido por middleware de tenant y suscripción.</p>
      <nav className="nav-grid">
        <Link href="/dashboard/orders/new" className="nav-tile"><strong>Nueva orden</strong><span className="muted">Ingreso con WhatsApp</span></Link>
        <Link href="/dashboard/customers" className="nav-tile"><strong>Clientes</strong><span className="muted">CRM del taller</span></Link>
        <Link href="/dashboard/checklist-templates" className="nav-tile"><strong>Checklists</strong><span className="muted">Plantillas normalizadas</span></Link>
        <Link href="/dashboard/tenant-settings" className="nav-tile"><strong>Branding</strong><span className="muted">Portal y PDFs por tenant</span></Link>
        <Link href="/dashboard/inventory" className="nav-tile"><strong>Inventario</strong><span className="muted">Refacciones y stock</span></Link>
        <Link href="/dashboard/suppliers" className="nav-tile"><strong>Proveedores</strong><span className="muted">Contactos y abastecimiento</span></Link>
        <Link href="/dashboard/purchase-orders" className="nav-tile"><strong>Compras</strong><span className="muted">Órdenes y recepción</span></Link>
        <Link href="/dashboard/expenses" className="nav-tile"><strong>Gastos</strong><span className="muted">Finanzas operativas</span></Link>
        <Link href="/dashboard/reports" className="nav-tile"><strong>Reportes</strong><span className="muted">KPIs y CSV</span></Link>
      </nav>
      {billing?.storage ? (
        <section className="card stack section">
          <strong>Uso de almacenamiento</strong>
          <div className="muted">
            {formatBytes(billing.storage.usedBytes ?? 0)} / {billing.storage.limitBytes ? formatBytes(billing.storage.limitBytes) : "Ilimitado"}
          </div>
          <div className="progress-shell">
            <div
              className={`progress-bar ${billing.storage.blocked ? "danger" : billing.storage.warning ? "warning" : ""}`}
              style={{ width: `${billing.storage.percentUsed ?? 0}%` }}
            />
          </div>
          {billing.storage.warning ? <div className="muted">Te acercas al límite del plan.</div> : null}
          {billing.storage.blocked ? <div className="muted">Bloqueo activo por cuota de almacenamiento.</div> : null}
        </section>
      ) : null}
      {error ? <p>{error}</p> : null}
      <div className="cards">
        {orders.map((order) => (
          <article key={order.id} className="card">
            <div className="muted">{order.folio}</div>
            <h2>{order.vehicle_plate}</h2>
            <p>{order.description}</p>
            <p>{order.status}</p>
            <Link href={`/dashboard/orders/${order.folio}`} className="secondary">Abrir detalle</Link>
          </article>
        ))}
      </div>
    </main>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
