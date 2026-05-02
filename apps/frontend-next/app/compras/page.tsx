'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShoppingCart, CheckCircle2, XCircle, Package } from 'lucide-react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { getSupabaseClient } from '@/lib/supabase';
import type { InventoryProductDto, PurchaseOrderDto, SupplierDto } from '@sdmx/contracts';

type ItemForm = {
  productId: string;
  quantity: string;
  unitCostCents: string;
};

const emptyItem: ItemForm = {
  productId: '',
  quantity: '',
  unitCostCents: ''
};

export default function ComprasPage() {
  const [tenantId, setTenantId] = useState('');

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<InventoryProductDto[]>([]);
  const [purchases, setPurchases] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([{ ...emptyItem }]);

  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers]);
  const productMap = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    const resolveTenant = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      setTenantId(data.session?.user.app_metadata?.tenant_id || '');
    };

    void resolveTenant();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [suppliersRes, productsRes, purchasesRes] = await Promise.all([
        apiClient.get<SupplierDto[]>('/api/suppliers'),
        apiClient.get<InventoryProductDto[]>('/api/products'),
        apiClient.get<PurchaseOrderDto[]>('/api/purchases')
      ]);

      if (suppliersRes.success && suppliersRes.data) setSuppliers(suppliersRes.data);
      if (productsRes.success && productsRes.data) setProducts(productsRes.data);
      if (purchasesRes.success && purchasesRes.data) setPurchases(purchasesRes.data);

      const firstSupplier = suppliersRes.data?.[0]?.id ?? '';
      if (!supplierId && firstSupplier) setSupplierId(firstSupplier);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const addItem = () => setItems((current) => [...current, { ...emptyItem }]);
  const removeItem = (index: number) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  const updateItem = (index: number, patch: Partial<ItemForm>) =>
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  const createPurchase = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }
    if (!supplierId) {
      setError('Selecciona un proveedor');
      return;
    }

    const payloadItems = items
      .filter((item) => item.productId && Number(item.quantity) > 0 && Number(item.unitCostCents) >= 0)
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitCostCents: Number(item.unitCostCents)
      }));

    if (payloadItems.length === 0) {
      setError('Agrega al menos un item válido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post<PurchaseOrderDto>('/api/purchases', {
        supplierId,
        notes: notes || null,
        items: payloadItems
      });

      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo crear la compra');

      setNotes('');
      setItems([{ ...emptyItem }]);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la compra');
    } finally {
      setSaving(false);
    }
  };

  const confirmPurchase = async (purchaseId: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post<PurchaseOrderDto>(`/api/purchases/${purchaseId}/confirm`, {
        tenantId
      });
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo confirmar la compra');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar la compra');
    } finally {
      setSaving(false);
    }
  };

  const cancelPurchase = async (purchaseId: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post<PurchaseOrderDto>(`/api/purchases/${purchaseId}/cancel`);
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo cancelar la compra');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la compra');
    } finally {
      setSaving(false);
    }
  };

  const totalDraftCents = items.reduce((acc, item) => {
    const quantity = Number(item.quantity);
    const unit = Number(item.unitCostCents);
    return acc + (Number.isFinite(quantity) && Number.isFinite(unit) ? quantity * unit : 0);
  }, 0);

  return (
    <SaasShell title="Compras" subtitle="Órdenes de compra con confirmación que impacta inventario y Kardex.">
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="srf-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Compras</h2>
                <p className="text-slate-500 text-sm">Draft, confirmación e impacto en stock real.</p>
              </div>
            </div>
            <button onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
              <RefreshCw className="h-4 w-4" />
              Recargar
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const supplier = supplierMap.get(purchase.supplier_id);
                return (
                  <article key={purchase.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Compra</div>
                        <h3 className="mt-2 text-lg font-black text-white">{supplier?.name || purchase.supplier_id}</h3>
                        <p className="mt-1 text-sm text-slate-400">Estado: {purchase.status}</p>
                        <p className="mt-1 text-sm text-slate-400">Total: ${(Number(purchase.total_amount_cents || 0) / 100).toFixed(2)} {purchase.currency}</p>
                        {purchase.notes ? <p className="mt-2 text-sm text-slate-500">{purchase.notes}</p> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {purchase.status === 'draft' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void confirmPurchase(purchase.id)}
                              className="inline-flex items-center gap-2 rounded-2xl bg-[#1F7EDC] px-4 py-3 text-sm font-black text-white"
                              disabled={saving}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => void cancelPurchase(purchase.id)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"
                              disabled={saving}
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {(purchase.items || []).map((item) => {
                        const product = productMap.get(item.product_id);
                        return (
                          <div key={item.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
                            <div>
                              <div className="font-bold text-white">{product?.name || item.product_id}</div>
                              <div className="text-slate-500">{item.quantity} x ${(item.unit_cost_cents / 100).toFixed(2)}</div>
                            </div>
                            <div className="font-black text-emerald-300">${(item.total_cost_cents / 100).toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="srf-card p-6 md:p-8 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Nueva compra</h2>
              <p className="text-slate-500 text-sm">Guarda draft y confirma cuando el pedido esté listo.</p>
            </div>
          </div>

          <form onSubmit={createPurchase} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Proveedor</label>
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
              >
                <option value="">Selecciona un proveedor</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${index}-${item.productId}`} className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      <Package className="h-4 w-4 text-slate-400" />
                      Item {index + 1}
                    </div>
                    {items.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-xs font-black uppercase tracking-widest text-red-300"
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  <select
                    value={item.productId}
                    onChange={(event) => updateItem(index, { productId: event.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                  >
                    <option value="">Selecciona producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.sku} - {product.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: event.target.value })}
                      placeholder="Cantidad"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                    />
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={item.unitCostCents}
                      onChange={(event) => updateItem(index, { unitCostCents: event.target.value })}
                      placeholder="Costo unitario en centavos"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
            >
              <Plus className="h-4 w-4" />
              Agregar item
            </button>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Notas</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Observaciones de la orden de compra"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              Total draft: <span className="font-black text-white">${(totalDraftCents / 100).toFixed(2)}</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-[#1F7EDC] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Crear compra draft'}
            </button>
          </form>
        </section>
      </div>
    </SaasShell>
  );
}
