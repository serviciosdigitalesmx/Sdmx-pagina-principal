"use client";

import Link from "next/link";

const steps = [
  "Seleccionar cliente",
  "Definir vehículo o dispositivo",
  "Elegir plantilla de checklist",
  "Generar folio, portal y WhatsApp"
];

export default function RecepcionPage() {
  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Recepción de Equipos</h1>
        <p className="muted">Ingreso rápido con checklist, portal y evidencia.</p>
      </header>
      <div className="grid-2 section">
        <section className="card stack">
          <h2>Flujo de recepción</h2>
          {steps.map((step, index) => (
            <div key={step} className="card">
              <strong>Paso {index + 1}</strong>
              <div className="muted">{step}</div>
            </div>
          ))}
        </section>
        <section className="card stack">
          <h2>Acciones</h2>
          <Link href="/dashboard/orders/new" className="primary">Crear nueva orden</Link>
          <Link href="/dashboard/checklist-templates" className="secondary">Administrar checklists</Link>
          <Link href="/consultar" className="secondary">Abrir portal público</Link>
        </section>
      </div>
    </main>
  );
}
