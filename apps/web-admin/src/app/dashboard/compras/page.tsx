'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, ShoppingCart, Package, Truck, CheckCircle2, X } from 'lucide-react';
import { fixService } from '@/services/fixService';

type PurchaseOrderRow = {
  id?: string;
  folio?: string;
  status?: string;
  supplier_id?: string;
  expected_date?: string | null;
  total?: number | string;
};

type SupplierRow = { id?: string; business_name?: string };

type PurchaseForm = {
  supplierId: string;
  expectedDate: string;
  notes: string;
  paymentTerms: string;
  reference: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  quantity: string;
  unitCost: string;
};

const INITIAL_FORM: PurchaseForm = {
  supplierId: '',
  expectedDate: '',
  notes: '',
  paymentTerms: '',
  reference: '',
  skuSnapshot: '',
  productNameSnapshot: '',
  quantity: '1',
  unitCost: '0',
};

function currency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value ?? 0) || 0);
}

export default function ComprasPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PurchaseForm>(INITIAL_FORM);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, suppliersData] = await Promise.all([fixService.getPurchaseOrders(), fixService.getSuppliers()]);
      setOrders(ordersData as PurchaseOrderRow[]);
      setSuppliers(suppliersData as SupplierRow[]);
      setError('');
    } catch (err) {
      setOrders([]);
      setSuppliers([]);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const supplierMap = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier.business_name ?? supplier.id ?? 'Proveedor'])), [suppliers]);

  async function submitPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      await fixService.createPurchaseOrder({
        supplierId: form.supplierId,
        expectedDate: form.expectedDate || undefined,
        notes: form.notes || undefined,
        paymentTerms: form.paymentTerms || undefined,
        reference: form.reference || undefined,
        items: [
          {
            skuSnapshot: form.skuSnapshot || undefined,
            productNameSnapshot: form.productNameSnapshot || undefined,
            quantity: Number(form.quantity),
            unitCost: Number(form.unitCost),
          },
        ],
      });
      setShowForm(false);
      setForm(INITIAL_FORM);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la orden de compra');
    } finally {
      setSaving(false);
    }
  }

  async function receiveOrder(order: PurchaseOrderRow) {
    if (!order.id) return;
    try {
      setReceivingId(order.id);
      setError('');
      await fixService.receivePurchaseOrder(order.id, { notes: 'Recepción desde panel legacy migrado' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recibir la orden de compra');
    } finally {
      setReceivingId(null);
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Compras</h1>
          <p className="mt-1 text-sm text-srf-muted">{orders.length} órdenes de compra · {suppliers.length} proveedores</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadData()} className="btn-outline gap-2 inline-flex items-center">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
          <button onClick={() => setShowForm((value) => !value)} className="btn-primary gap-2 inline-flex items-center">
            <Plus className="w-4 h-4" />
            Nueva compra
          </button>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      {showForm ? (
        <form onSubmit={submitPurchase} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-srf-primary">Crear orden de compra</h2>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost inline-flex items-center gap-2 text-srf-muted">
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <select value={form.supplierId} onChange={(e) => setForm((current) => ({ ...current, supplierId: e.target.value }))} className="input" required>
              <option value="">Selecciona proveedor</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.business_name ?? supplier.id}</option>)}
            </select>
            <input value={form.expectedDate} onChange={(e) => setForm((current) => ({ ...current, expectedDate: e.target.value }))} className="input" type="date" />
            <input value={form.reference} onChange={(e) => setForm((current) => ({ ...current, reference: e.target.value }))} className="input" placeholder="Referencia" />
            <input value={form.paymentTerms} onChange={(e) => setForm((current) => ({ ...current, paymentTerms: e.target.value }))} className="input" placeholder="Términos de pago" />
            <input value={form.skuSnapshot} onChange={(e) => setForm((current) => ({ ...current, skuSnapshot: e.target.value }))} className="input" placeholder="SKU" />
            <input value={form.productNameSnapshot} onChange={(e) => setForm((current) => ({ ...current, productNameSnapshot: e.target.value }))} className="input" placeholder="Nombre del producto" required />
            <input value={form.quantity} onChange={(e) => setForm((current) => ({ ...current, quantity: e.target.value }))} className="input" type="number" min="1" step="1" placeholder="Cantidad" required />
            <input value={form.unitCost} onChange={(e) => setForm((current) => ({ ...current, unitCost: e.target.value }))} className="input" type="number" min="0" step="0.01" placeholder="Costo unitario" required />
            <textarea value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} className="input min-h-24 md:col-span-2" placeholder="Notas" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Crear orden'}</button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Órdenes</div>
          <div className="mt-3 text-3xl font-bold text-srf-primary">{orders.length}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Proveedores</div>
          <div className="mt-3 text-3xl font-bold text-srf-primary">{suppliers.length}</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.2em] text-srf-muted">Total visible</div>
          <div className="mt-3 text-3xl font-bold text-srf-accent">{currency(orders.reduce((sum, order) => sum + Number(order.total ?? 0), 0))}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {orders.map((order) => (
          <div key={order.id} className="card card-hover">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-srf-primary">{order.folio || order.id}</div>
                <div className="text-xs text-srf-muted">{order.expected_date ? new Date(order.expected_date).toLocaleDateString('es-MX') : 'Sin fecha estimada'}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold
                ${order.status === 'recibida' ? 'bg-green-500/20 text-green-500 border border-green-500/30' : ''}
                ${order.status === 'recepcion_parcial' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : ''}
                ${order.status === 'emitida' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' : ''}
                ${!order.status || order.status === 'borrador' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
                ${order.status === 'cancelada' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : ''}
              `}>
                {(order.status || 'borrador').toUpperCase().replace('_', ' ')}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-srf-muted">
              <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-srf-primary" /><span>{supplierMap.get(order.supplier_id) || order.supplier_id || 'Sin proveedor'}</span></div>
              <div className="flex items-center gap-2"><Package className="w-4 h-4 text-srf-primary" /><span>Total: {currency(order.total)}</span></div>
              <div className="flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-srf-primary" /><span>Estado: {order.status || 'borrador'}</span></div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => void receiveOrder(order)}
                className="btn-outline inline-flex items-center gap-2"
                disabled={receivingId === order.id || order.status === 'recibida'}
              >
                <CheckCircle2 className="w-4 h-4" />
                {receivingId === order.id ? 'Recibiendo...' : order.status === 'recibida' ? 'Recibida' : 'Recibir'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? <div className="py-12 text-center text-srf-muted">No hay órdenes de compra registradas.</div> : null}
    </div>
  );
}
