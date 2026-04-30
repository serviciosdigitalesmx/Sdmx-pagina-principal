"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type Customer = { id: string; full_name: string; phone?: string; email?: string; address?: string };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch("/v1/customers").then((data) => setCustomers(data.customers ?? []));

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/customers", {
        method: "POST",
        body: JSON.stringify({ fullName, phone, email, address })
      });
      setFullName("");
      setPhone("");
      setEmail("");
      setAddress("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title="Clientes" subtitle="Clientes del tenant actual." />
      <div className="grid-2 section">
        <form className="card stack" onSubmit={submit}>
          <h2>Nuevo cliente</h2>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre completo" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección" />
          {error ? <p>{error}</p> : null}
          <button type="submit">Guardar</button>
        </form>
        <div className="card">
          <h2>Listado</h2>
          <div className="stack">
            {customers.map((customer) => (
              <div key={customer.id} className="card">
                <strong>{customer.full_name}</strong>
                <div className="muted">{customer.phone || "-"}</div>
                <div className="muted">{customer.email || "-"}</div>
                <div className="muted">{customer.address || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
