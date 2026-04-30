"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type PurchaseOrder = { id: string; folio_oc: string; status: string; total: number; order_date: string; supplier?: { name: string } };

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; purchase_price: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: "", orderDate: "", items: [{ productId: "", quantity: 1, unitPrice: 0 }] });

  const load = async () => {
    const [ordersData, suppliersData, productsData] = await Promise.all([
      apiFetch("/v1/purchase-orders"),
      apiFetch("/v1/suppliers"),
      apiFetch("/v1/inventory")
    ]);
    setOrders(ordersData.data ?? []);
    setSuppliers(suppliersData.suppliers ?? []);
    setProducts(productsData.products ?? []);
  };

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/purchase-orders", { method: "POST", body: JSON.stringify(form) });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function receive(id: string) {
    await apiFetch(`/v1/purchase-orders/${id}/receive`, { method: "POST" });
    await load();
  }

  return (
    <main className="shell">
      <DashboardHeader title="Compras" subtitle="Órdenes de compra y recepción de mercancía." />
      <div className="actions section">
        <button type="button" onClick={() => setShowForm(true)}>+ Nueva orden</button>
      </div>
      {error ? <p>{error}</p> : null}
      <div className="table-wrap section">
        <table>
          <thead>
            <tr><th>Folio</th><th>Proveedor</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Acción</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.folio_oc}</td>
                <td>{order.supplier?.name || "-"}</td>
                <td>{order.order_date}</td>
                <td>${order.total}</td>
                <td>{order.status}</td>
                <td>{order.status === "pendiente" ? <button type="button" onClick={() => receive(order.id)}>Recibir</button> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm ? (
        <div className="card section">
          <h2>Nueva orden de compra</h2>
          <form className="stack" onSubmit={submit}>
            <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Selecciona proveedor</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
            <input type="date" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
            <div className="stack">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid-2">
                  <select value={item.productId} onChange={(e) => {
                    const selected = products.find((p) => p.id === e.target.value);
                    setForm({
                      ...form,
                      items: form.items.map((entry, entryIndex) =>
                        entryIndex === idx
                          ? { ...entry, productId: e.target.value, unitPrice: selected?.purchase_price ?? 0 }
                          : entry
                      )
                    });
                  }}>
                    <option value="">Producto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={(e) => {
                    setForm({
                      ...form,
                      items: form.items.map((entry, entryIndex) =>
                        entryIndex === idx ? { ...entry, quantity: Number(e.target.value) } : entry
                      )
                    });
                  }} />
                </div>
              ))}
            </div>
            <div className="actions">
              <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1, unitPrice: 0 }] })}>+ Agregar producto</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit">Guardar</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
