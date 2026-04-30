"use client";

import Link from "next/link";

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="section">
      <Link href="/dashboard" className="muted">← Volver al dashboard</Link>
      <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>{title}</h1>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
