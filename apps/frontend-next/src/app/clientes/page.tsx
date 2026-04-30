"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Customer = { id: string; full_name: string; phone?: string; email?: string; address?: string };

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
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
      const res = await fetch(`${apiBaseUrl}/v1/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load customers");
      const payload = await res.json();
      setCustomers(payload.customers ?? []);
    })().catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, []);

  return (
    <main className="shell">
      <header className="section stack">
        <Link href="/hub" className="muted">← Volver al hub</Link>
        <h1 style={{ fontSize: "2.5rem", marginTop: 12 }}>Directorio de Clientes</h1>
        <p className="muted">Acceso legacy a clientes del tenant.</p>
      </header>
      <div className="actions section">
        <Link href="/dashboard/customers" className="primary">Abrir CRM completo</Link>
      </div>
      {error ? <p>{error}</p> : null}
      <section className="cards section">
        {customers.map((customer) => (
          <article key={customer.id} className="card">
            <strong>{customer.full_name}</strong>
            <p className="muted">{customer.phone || "-"}</p>
            <p className="muted">{customer.email || "-"}</p>
            <p className="muted">{customer.address || "-"}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
