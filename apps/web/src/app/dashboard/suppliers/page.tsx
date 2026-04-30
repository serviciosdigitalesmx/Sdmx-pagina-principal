"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type Supplier = { id: string; name: string; contact_name?: string; phone?: string; email?: string };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ name: "", contactName: "", phone: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  const load = () => apiFetch("/v1/suppliers").then((data) => setSuppliers(data.suppliers ?? []));
  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/suppliers", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", contactName: "", phone: "", email: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title="Proveedores" subtitle="Base de abastecimiento del taller." />
      <div className="grid-2 section">
        <form className="card stack" onSubmit={submit}>
          <h2>Nuevo proveedor</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre" />
          <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Contacto" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Teléfono" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          {error ? <p>{error}</p> : null}
          <button type="submit">Guardar</button>
        </form>
        <div className="card stack">
          <h2>Listado</h2>
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="card">
              <strong>{supplier.name}</strong>
              <div className="muted">{supplier.contact_name || "-"}</div>
              <div className="muted">{supplier.phone || "-"}</div>
              <div className="muted">{supplier.email || "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
