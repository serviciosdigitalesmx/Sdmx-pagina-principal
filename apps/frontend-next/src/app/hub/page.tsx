"use client";

import Link from "next/link";

const tiles = [
  { href: "/recepcion", title: "Recepción", subtitle: "Ingreso y creación de órdenes" },
  { href: "/tecnico", title: "Técnico", subtitle: "Cola operativa y seguimiento" },
  { href: "/clientes", title: "Clientes", subtitle: "CRM del taller" },
  { href: "/billing", title: "Billing", subtitle: "Prueba, activación y plan" },
  { href: "/auditoria", title: "Auditoría", subtitle: "Eventos por tenant" },
  { href: "/portal", title: "Portal", subtitle: "Seguimiento de folio" },
  { href: "/dashboard", title: "Dashboard", subtitle: "Panel principal" },
  { href: "/pricing", title: "Pricing", subtitle: "Planes y activación" }
] as const;

export default function HubPage() {
  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/dashboard" className="muted">← Volver al dashboard</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Hub Operativo</h1>
        <p className="muted">Entrada rápida a los módulos vivos del SaaS.</p>
      </header>
      <section className="cards section">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="card">
            <strong>{tile.title}</strong>
            <p className="muted">{tile.subtitle}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
