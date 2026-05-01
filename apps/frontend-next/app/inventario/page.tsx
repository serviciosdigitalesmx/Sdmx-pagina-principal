'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { readSession } from '@/lib/session';
import { Boxes, ArrowDownRight, ArrowUpRight, RefreshCw, Plus, History } from 'lucide-react';
import type {
  InventoryKardexEntryDto,
  InventoryMovementDto,
  InventoryMovementTypeDto,
  InventoryProductDto
} from '@sdmx/contracts';

type ProductForm = {
  sku: string;
  name: string;
  category: string;
  unitCostMxn: string;
  salePriceMxn: string;
  minStock: string;
};

type MovementForm = {
  productId: string;
  movementType: InventoryMovementTypeDto;
  quantity: string;
  unitCostMxn: string;
  referenceType: string;
  referenceId: string;
  note: string;
};

const emptyProductForm: ProductForm = {
  sku: '',
  name: '',
  category: '',
  unitCostMxn: '',
  salePriceMxn: '',
  minStock: '0'
};

const emptyMovementForm: MovementForm = {
  productId: '',
  movementType: 'in',
  quantity: '',
  unitCostMxn: '',
  referenceType: '',
  referenceId: '',
  note: ''
};

export default function InventarioPage() {
  const [tenantId, setTenantId] = useState('');

  const [products, setProducts] = useState<InventoryProductDto[]>([]);
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [kardex, setKardex] = useState<InventoryKardexEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingMovement, setSavingMovement] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [error, setError] = useState('');
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [movementForm, setMovementForm] = useState<MovementForm>(emptyMovementForm);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  useEffect(() => {
    setTenantId(readSession()?.shop.id ?? '');
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [productsRes, movementsRes] = await Promise.allSettled([
        apiClient.get<InventoryProductDto[]>('/api/products'),
        apiClient.get<InventoryMovementDto[]>('/api/inventory/movements')
      ]);

      const messages: string[] = [];

      if (productsRes.status === 'fulfilled') {
        if (productsRes.value.success && productsRes.value.data) {
          setProducts(productsRes.value.data);
          if (!selectedProductId && productsRes.value.data[0]?.id) {
            setSelectedProductId(productsRes.value.data[0].id);
          }
        } else {
          messages.push(productsRes.value.error?.message || 'No se pudo cargar inventario');
        }
      } else {
        messages.push('No se pudo cargar inventario');
      }

      if (movementsRes.status === 'fulfilled') {
        if (movementsRes.value.success && movementsRes.value.data) {
          setMovements(movementsRes.value.data);
        } else {
          messages.push(movementsRes.value.error?.message || 'No se pudo cargar movimientos');
        }
      } else {
        messages.push('No se pudo cargar movimientos');
      }

      const productId = selectedProductId || (productsRes.status === 'fulfilled' && productsRes.value.success ? productsRes.value.data?.[0]?.id : '') || '';
      if (productId) {
        const kardexRes = await apiClient.get<InventoryKardexEntryDto[]>(`/api/products/${productId}/kardex`);
        if (kardexRes.success && kardexRes.data) {
          setKardex(kardexRes.data);
        } else {
          messages.push(kardexRes.error?.message || 'No se pudo cargar kardex');
        }
      }

      if (messages.length > 0) {
        setError(messages[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando inventario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const loadKardex = async () => {
      if (!selectedProductId) {
        setKardex([]);
        return;
      }
      const res = await apiClient.get<InventoryKardexEntryDto[]>(`/api/products/${selectedProductId}/kardex`);
      if (res.success && res.data) {
        setKardex(res.data);
      }
    };
    void loadKardex();
  }, [selectedProductId]);

  const handleCreateProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }

    setSavingProduct(true);
    setError('');
    try {
      const response = await apiClient.post<InventoryProductDto>('/api/products', {
        tenantId,
        sku: productForm.sku,
        name: productForm.name,
        category: productForm.category || null,
        unitCostMxn: productForm.unitCostMxn ? Number(productForm.unitCostMxn) : null,
        salePriceMxn: productForm.salePriceMxn ? Number(productForm.salePriceMxn) : null,
        minStock: productForm.minStock ? Number(productForm.minStock) : 0
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'No se pudo crear el producto');
      }

      setProductForm(emptyProductForm);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el producto');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleCreateMovement = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }
    if (!movementForm.productId) {
      setError('Selecciona un producto');
      return;
    }

    setSavingMovement(true);
    setError('');
    try {
      const response = await apiClient.post<InventoryMovementDto>('/api/inventory/movements', {
        tenantId,
        productId: movementForm.productId,
        movementType: movementForm.movementType,
        quantity: Number(movementForm.quantity),
        unitCostMxn: movementForm.unitCostMxn ? Number(movementForm.unitCostMxn) : null,
        referenceType: movementForm.referenceType || null,
        referenceId: movementForm.referenceId || null,
        note: movementForm.note || null
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'No se pudo registrar el movimiento');
      }

      setMovementForm({ ...emptyMovementForm, productId: movementForm.productId });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento');
    } finally {
      setSavingMovement(false);
    }
  };

  return (
    <SaasShell title="Inventario" subtitle="Stock real y Kardex con persistencia multi-tenant.">
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="srf-card p-6 md:p-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Productos</h2>
                  <p className="text-slate-500 text-sm">SKU, stock y alertas de reorden.</p>
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
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-40 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setSelectedProductId(product.id)}
                    className={`text-left rounded-3xl border p-5 transition ${
                      selectedProductId === product.id ? 'border-blue-400/50 bg-blue-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">SKU {product.sku}</div>
                        <h3 className="mt-2 text-lg font-black text-white">{product.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{product.category || 'Sin categoría'}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${product.current_stock <= product.min_stock ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'}`}>
                        {product.current_stock <= product.min_stock ? 'Reordenar' : 'Disponible'}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">Stock</div>
                        <div className="mt-1 font-black text-white">{Number(product.current_stock).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">Mín</div>
                        <div className="mt-1 font-black text-white">{Number(product.min_stock).toFixed(2)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">Costo</div>
                        <div className="mt-1 font-black text-white">
                          ${Number(product.unit_cost_mxn ?? 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {!products.length && (
                  <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
                    No hay productos aún. Crea el primero abajo.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <form onSubmit={handleCreateProduct} className="srf-card p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Nuevo producto</h3>
                  <p className="text-sm text-slate-500">Alta real en `inventory_products`.</p>
                </div>
              </div>

              <div className="grid gap-4">
                <input className="srf-input" placeholder="SKU" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} required />
                <input className="srf-input" placeholder="Nombre" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                <input className="srf-input" placeholder="Categoría" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input className="srf-input" placeholder="Costo MXN" value={productForm.unitCostMxn} onChange={(e) => setProductForm({ ...productForm, unitCostMxn: e.target.value })} />
                  <input className="srf-input" placeholder="Precio MXN" value={productForm.salePriceMxn} onChange={(e) => setProductForm({ ...productForm, salePriceMxn: e.target.value })} />
                </div>
                <input className="srf-input" placeholder="Stock mínimo" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} />
              </div>

              <button disabled={savingProduct} className="w-full srf-btn-primary py-4 font-black uppercase tracking-[0.12em]">
                {savingProduct ? 'Guardando...' : 'Crear producto'}
              </button>
            </form>

            <form onSubmit={handleCreateMovement} className="srf-card p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Movimiento Kardex</h3>
                  <p className="text-sm text-slate-500">Entrada, salida o ajuste.</p>
                </div>
              </div>

              <div className="grid gap-4">
                <select className="srf-input" value={movementForm.productId} onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })} required>
                  <option value="">Seleccionar producto</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.sku} - {product.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select className="srf-input" value={movementForm.movementType} onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value as InventoryMovementTypeDto })}>
                    <option value="in">Entrada</option>
                    <option value="out">Salida</option>
                    <option value="adjustment">Ajuste</option>
                    <option value="transfer">Transferencia</option>
                  </select>
                  <input className="srf-input" placeholder="Cantidad" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required />
                </div>
                <input className="srf-input" placeholder="Costo unitario MXN (opcional)" value={movementForm.unitCostMxn} onChange={(e) => setMovementForm({ ...movementForm, unitCostMxn: e.target.value })} />
                <input className="srf-input" placeholder="Referencia tipo" value={movementForm.referenceType} onChange={(e) => setMovementForm({ ...movementForm, referenceType: e.target.value })} />
                <input className="srf-input" placeholder="Referencia id" value={movementForm.referenceId} onChange={(e) => setMovementForm({ ...movementForm, referenceId: e.target.value })} />
                <textarea className="srf-input min-h-[96px] py-3" placeholder="Nota" value={movementForm.note} onChange={(e) => setMovementForm({ ...movementForm, note: e.target.value })} />
              </div>

              <button disabled={savingMovement} className="w-full srf-btn-primary py-4 font-black uppercase tracking-[0.12em]">
                {savingMovement ? 'Registrando...' : 'Registrar movimiento'}
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
          <div className="srf-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Movimientos recientes</h3>
                <p className="text-sm text-slate-500">Entradas y salidas más nuevas.</p>
              </div>
            </div>

            <div className="space-y-3">
              {movements.map((movement) => (
                <article key={movement.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        {movement.movement_type}
                      </div>
                      <div className="mt-1 text-white font-bold">{movement.note || movement.reference_type || 'Movimiento sin nota'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">{Number(movement.quantity).toFixed(2)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        {new Date(movement.created_at).toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {!movements.length && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-500">
                  Aún no hay movimientos registrados.
                </div>
              )}
            </div>
          </div>

          <div className="srf-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Kardex</h3>
                <p className="text-sm text-slate-500">
                  {selectedProduct ? `${selectedProduct.sku} · ${selectedProduct.name}` : 'Selecciona un producto'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {kardex.map((entry) => (
                <article key={entry.movement.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        {entry.movement.movement_type}
                      </div>
                      <div className="mt-1 text-white font-bold">
                        {entry.movement.reference_type || 'Sin referencia'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">
                        Balance: {Number(entry.balance).toFixed(2)}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">
                        {new Date(entry.movement.created_at).toLocaleString('es-MX')}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
              {!kardex.length && (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-sm text-slate-500">
                  El kardex aparecerá cuando existan movimientos.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SaasShell>
  );
}
