"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RequireRole } from "@/components/guard/RequireRole";
import { useAuth } from "@/components/guard/use-auth";
import { ModuleShell } from "@/components/dashboard/module-shell";
import { getActiveScope } from "@/lib/scope";
import { fixService } from "@/services/fixService";

type PurchaseOrderRow = {
  id?: string;
  folio?: string;
  status?: string;
  supplier_id?: string;
  sucursal_id?: string | null;
  expected_date?: string | null;
  total?: number | string;
  notes?: string | null;
  items?: Array<Record<string, unknown>>;
};

type PurchaseOrderDetail = {
  order?: PurchaseOrderRow;
  items?: Array<Record<string, unknown>>;
  movements?: Array<Record<string, unknown>>;
};

type SupplierRow = {
  id?: string;
  business_name?: string;
};

const emptyForm = {
  supplierId: "",
  sucursalId: "",
  expectedDate: "",
  reference: "",
  paymentTerms: "",
  notes: "",
  skuSnapshot: "",
  productNameSnapshot: "",
  quantity: "1",
  unitCost: "0",
};

export default function ComprasPage() {
  const { role } = useAuth();
  const scope = getActiveScope();
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderDetail | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("No se pudo copiar el texto.");
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [ordersData, suppliersData] = await Promise.all([
        fixService.getPurchaseOrders(),
        fixService.getSuppliers(),
      ]);
      const typedOrders = ordersData as PurchaseOrderRow[];
      setOrders(typedOrders);
      setSuppliers(suppliersData as SupplierRow[]);
      const currentId = selectedId || typedOrders[0]?.id || "";
      setSelectedId(currentId);
      if (currentId) {
        const detail = await fixService.getPurchaseOrderById(currentId);
        setSelectedOrder(detail as PurchaseOrderDetail);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar compras");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!scope?.sucursalId) {
      return;
    }
    setForm((current) => (current.sucursalId ? current : { ...current, sucursalId: scope.sucursalId ?? "" }));
  }, [scope?.sucursalId]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function loadDetail() {
      try {
        const detail = await fixService.getPurchaseOrderById(selectedId);
        if (!cancelled) setSelectedOrder(detail as PurchaseOrderDetail);
      } catch {
        if (!cancelled) setSelectedOrder(null);
      }
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const stats = useMemo(
    () => [
      { label: "Órdenes", value: String(orders.length), helper: "Compras registradas." },
      { label: "Proveedores", value: String(suppliers.length), helper: "Catálogo de abastecimiento." },
      { label: "Rol", value: role, helper: "Permisos por usuario." },
      { label: "Sucursal", value: scope?.sucursalId ?? "No disponible", helper: scope?.mode === "consolidated" ? "Vista consolidada." : "Sucursal activa." },
    ],
    [orders.length, role, scope?.mode, scope?.sucursalId, suppliers.length],
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = {
        supplierId: form.supplierId.trim(),
        sucursalId: form.sucursalId.trim() || undefined,
        expectedDate: form.expectedDate.trim() || undefined,
        notes: form.notes.trim() || undefined,
        paymentTerms: form.paymentTerms.trim() || undefined,
        reference: form.reference.trim() || undefined,
        items: [
          {
            skuSnapshot: form.skuSnapshot.trim(),
            productNameSnapshot: form.productNameSnapshot.trim(),
            quantity: Number(form.quantity || 0),
            unitCost: Number(form.unitCost || 0),
          },
        ],
      };
      await fixService.createPurchaseOrder(payload);
      setForm(emptyForm);
      setSelectedId("");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la compra");
    } finally {
      setSaving(false);
    }
  }

  async function handleReceive() {
    if (!selectedId) return;
    try {
      setSaving(true);
      setError("");
      await fixService.receivePurchaseOrder(selectedId, {
        notes: `Recepción operativa ${new Date().toISOString()}`,
        receivedItems: selectedOrder?.items?.map((item) => ({
          skuSnapshot: String(item.sku_snapshot ?? ""),
          quantity: Number(item.qty_ordered ?? 0),
        })) ?? [],
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo recibir la compra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireRole allowed={["owner", "manager"]}>
      <ModuleShell
        title="Compras"
        subtitle="Órdenes de compra reales con recepción e impacto en inventario."
        icon="fas fa-cart-shopping"
        actionLabel="Nueva compra"
        onAction={() => {
          setSelectedId("");
          setSelectedOrder(null);
          setForm(emptyForm);
        }}
        secondaryActionLabel="Actualizar"
        secondaryOnAction={() => void loadData()}
        stats={stats}
        loading={loading}
        columns={[
          { label: "Folio", key: "folio" },
          { label: "Estado", key: "status" },
          { label: "Proveedor", key: "supplier_id" },
          { label: "Total", key: "total" },
        ]}
        rows={orders.map((order) => ({
          folio: order.folio ?? "",
          status: order.status ?? "",
          supplier_id: order.supplier_id ?? "",
          total: String(order.total ?? 0),
        }))}
        emptyTitle={loading ? "Cargando compras…" : error ? "No pudimos cargar compras" : "No hay compras registradas"}
        emptyCopy={error || "La lista real sale de /api/:tenantSlug/purchase-orders."}
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-50">Crear compra real</h2>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-400 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm text-zinc-300 md:col-span-2">
                <span>Proveedor</span>
                <select
                  value={form.supplierId}
                  onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.business_name ?? supplier.id}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ["sucursalId", "Sucursal (sucursalId)"],
                ["expectedDate", "Fecha esperada"],
                ["reference", "Referencia"],
                ["paymentTerms", "Términos de pago"],
                ["skuSnapshot", "SKU snapshot"],
                ["productNameSnapshot", "Nombre snapshot"],
                ["quantity", "Cantidad"],
                ["unitCost", "Costo unitario"],
              ].map(([key, label]) => (
                <label key={key} className="space-y-1 text-sm text-zinc-300">
                  <span>{label}</span>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
                  />
                </label>
              ))}
              <label className="space-y-1 text-sm text-zinc-300 md:col-span-2">
                <span>Notas</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
                />
              </label>
            </div>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
          </form>

          <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-zinc-50">Detalle y recepción</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100"
                >
                  Actualizar
                </button>
                <button
                  type="button"
                  onClick={() => void handleReceive()}
                  disabled={!selectedId || saving}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 disabled:opacity-60"
                >
                  Recibir compra
                </button>
              </div>
            </div>
            <label className="space-y-1 text-sm text-zinc-300">
              <span>Orden activa</span>
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none"
              >
                <option value="">Nueva orden</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.folio} · {order.status}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-3">
              {selectedOrder ? (
                <>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 text-sm text-zinc-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-50">{selectedOrder.order?.folio}</span>
                      <div className="flex items-center gap-2">
                        {selectedOrder.order?.folio ? (
                          <button
                            type="button"
                            onClick={() => void copyText(selectedOrder.order?.folio ?? "", "Folio copiado")}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200"
                          >
                            Copiar folio
                          </button>
                        ) : null}
                        <span>{selectedOrder.order?.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-zinc-400">Proveedor: {selectedOrder.order?.supplier_id}</div>
                    <div className="mt-1 text-zinc-400">Total: {String(selectedOrder.order?.total ?? 0)}</div>
                  </div>
                  <div className="space-y-2">
                    {(selectedOrder.items ?? []).map((item, index) => (
                      <div key={`${selectedOrder.order?.id ?? selectedId}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-sm text-zinc-300">
                        <div className="font-medium text-zinc-50">{String(item.product_name_snapshot ?? item.sku_snapshot ?? "Item")}</div>
                        <div className="mt-1 flex justify-between">
                          <span>{String(item.qty_ordered ?? 0)} unidades</span>
                          <span>${String(item.unit_cost ?? 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-400">Selecciona una compra para ver su detalle real.</p>
              )}
            </div>
            {copied ? <p className="text-xs uppercase tracking-[0.18em] text-emerald-300">{copied}</p> : null}
          </div>
        </div>
      </ModuleShell>
    </RequireRole>
  );
}
