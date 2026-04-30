"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type Product = { id: string; name: string; category: string; stock: number; min_stock_alert: number; sale_price: number };
type Movement = { id: string; movement_type: string; quantity: number; reference_type?: string; created_at: string; product?: { name: string } };

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [form, setForm] = useState({ name: "", category: "", supplierId: "", stock: 0, minStockAlert: 0, purchasePrice: 0, salePrice: 0 });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [productsData, movementsData] = await Promise.all([
      apiFetch("/v1/inventory"),
      apiFetch("/v1/inventory/movements")
    ]);
    setProducts(productsData.products ?? []);
    setMovements(movementsData.movements ?? []);
  };
  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/inventory", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", category: "", supplierId: "", stock: 0, minStockAlert: 0, purchasePrice: 0, salePrice: 0 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function adjust(id: string, type: "add" | "remove") {
    await apiFetch(`/v1/inventory/${id}/stock`, { method: "POST", body: JSON.stringify({ quantity: 1, type }) });
    await load();
  }

  return (
    <main className="shell">
      <DashboardHeader title="Inventario" subtitle="Productos, stock y alertas." />
      <div className="grid-2 section">
        <form className="card stack" onSubmit={submit}>
          <h2>Nuevo producto</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Producto" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoría" />
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="Stock" />
          <input type="number" value={form.minStockAlert} onChange={(e) => setForm({ ...form, minStockAlert: Number(e.target.value) })} placeholder="Alerta mínima" />
          <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: Number(e.target.value) })} placeholder="Precio compra" />
          <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} placeholder="Precio venta" />
          {error ? <p>{error}</p> : null}
          <button type="submit">Guardar</button>
        </form>
        <div className="card">
          <h2>Listado</h2>
          <div className="stack">
            {products.map((product) => (
              <div key={product.id} className="card">
                <strong>{product.name}</strong>
                <div className="muted">{product.category}</div>
                <div className="muted">Stock: {product.stock} | Alerta: {product.min_stock_alert}</div>
                <div className="muted">Venta: ${product.sale_price}</div>
                <div className="actions" style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => adjust(product.id, "add")}>+1</button>
                  <button type="button" onClick={() => adjust(product.id, "remove")}>-1</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className="card section stack">
        <h2>Movimientos recientes</h2>
        {movements.map((movement) => (
          <div key={movement.id} className="card">
            <strong>{movement.product?.name || "-"}</strong>
            <div className="muted">{movement.movement_type} · {movement.quantity}</div>
            <div className="muted">{movement.reference_type || "-"}</div>
          </div>
        ))}
        {!movements.length ? <p className="muted">Sin movimientos registrados.</p> : null}
      </section>
    </main>
  );
}
