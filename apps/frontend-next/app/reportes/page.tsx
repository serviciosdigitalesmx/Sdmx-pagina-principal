'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, RefreshCw } from 'lucide-react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { useAuthReady } from '@/lib/use-auth-ready';
import type {
  FinanceReportDto,
  InventoryReportDto,
  OperationsReportDto,
  PurchasesExpensesReportDto
} from '@sdmx/contracts';

type ReportResponse =
  | { kind: 'operations'; data: OperationsReportDto }
  | { kind: 'finance'; data: FinanceReportDto }
  | { kind: 'inventory'; data: InventoryReportDto }
  | { kind: 'purchases-expenses'; data: PurchasesExpensesReportDto };

export default function ReportesPage() {
  const authReady = useAuthReady();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [operations, setOperations] = useState<OperationsReportDto | null>(null);
  const [finance, setFinance] = useState<FinanceReportDto | null>(null);
  const [inventory, setInventory] = useState<InventoryReportDto | null>(null);
  const [purchasesExpenses, setPurchasesExpenses] = useState<PurchasesExpensesReportDto | null>(null);

  useEffect(() => {
    const current = new Date();
    const todayIso = current.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setFrom(thirtyDaysAgo);
    setTo(todayIso);
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString();
  }, [from, to]);

  const loadReports = async () => {
    setError('');
    try {
      const [operationsRes, financeRes, inventoryRes, purchasesExpensesRes] = await Promise.allSettled([
        apiClient.get<OperationsReportDto>(`/api/reports/operations?${query}`),
        apiClient.get<FinanceReportDto>(`/api/reports/finance?${query}`),
        apiClient.get<InventoryReportDto>(`/api/reports/inventory?${query}`),
        apiClient.get<PurchasesExpensesReportDto>(`/api/reports/purchases-expenses?${query}`)
      ]);

      const messages: string[] = [];

      if (operationsRes.status === 'fulfilled' && operationsRes.value.success) {
        setOperations(operationsRes.value.data || null);
      } else {
        messages.push(operationsRes.status === 'fulfilled' ? operationsRes.value.error?.message || 'No se pudo cargar reporte operativo' : 'No se pudo cargar reporte operativo');
        setOperations(null);
      }

      if (financeRes.status === 'fulfilled' && financeRes.value.success) {
        setFinance(financeRes.value.data || null);
      } else {
        messages.push(financeRes.status === 'fulfilled' ? financeRes.value.error?.message || 'No se pudo cargar reporte financiero' : 'No se pudo cargar reporte financiero');
        setFinance(null);
      }

      if (inventoryRes.status === 'fulfilled' && inventoryRes.value.success) {
        setInventory(inventoryRes.value.data || null);
      } else {
        messages.push(inventoryRes.status === 'fulfilled' ? inventoryRes.value.error?.message || 'No se pudo cargar reporte de inventario' : 'No se pudo cargar reporte de inventario');
        setInventory(null);
      }

      if (purchasesExpensesRes.status === 'fulfilled' && purchasesExpensesRes.value.success) {
        setPurchasesExpenses(purchasesExpensesRes.value.data || null);
      } else {
        messages.push(
          purchasesExpensesRes.status === 'fulfilled'
            ? purchasesExpensesRes.value.error?.message || 'No se pudo cargar reporte de compras y gastos'
            : 'No se pudo cargar reporte de compras y gastos'
        );
        setPurchasesExpenses(null);
      }

      if (messages.length > 0) {
        setError(messages[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authReady || !from || !to) return;
    void loadReports();
  }, [authReady, query]);

  const handleRefresh = (event?: FormEvent) => {
    event?.preventDefault();
    setRefreshing(true);
    void loadReports();
  };

  const formatCurrency = (value: number) => `$${(value / 100).toFixed(2)}`;

  return (
    <SaasShell title="Reportes" subtitle="Resumen operativo, financiero e inventario basado en datos reales.">
      <div className="space-y-6">
        <form onSubmit={handleRefresh} className="srf-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Filtros</h2>
                <p className="text-slate-500 text-sm">Rango de fecha para todos los reportes.</p>
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Actualizar
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Desde</label>
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.28em] text-slate-500">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
              />
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-bold text-red-300">
              {error}
            </div>
          )}
        </form>

        {loading ? (
          <div className="srf-card p-8 text-slate-400">Cargando reportes...</div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Órdenes</div>
                <div className="mt-2 text-3xl font-black text-white">{operations?.totalOrders ?? 0}</div>
                <div className="mt-2 text-sm text-slate-400">Total del rango</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Ingresos estimados</div>
                <div className="mt-2 text-3xl font-black text-white">{formatCurrency(finance?.estimatedRevenueCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Fuente: {finance?.revenueSource || 'n/a'}</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Egresos</div>
                <div className="mt-2 text-3xl font-black text-white">{formatCurrency(finance?.totalExpensesCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Gastos registrados</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Balance estimado</div>
                <div className="mt-2 text-3xl font-black text-white">{formatCurrency(finance?.estimatedBalanceCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Ingresos - egresos - compras</div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Operativo</h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {(operations?.ordersByStatus || []).map((item) => (
                    <div key={item.status} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-widest text-slate-500">{item.status}</div>
                      <div className="mt-1 text-2xl font-black text-white">{item.count}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="text-sm font-bold text-slate-300">Órdenes creadas por fecha</div>
                  <div className="mt-3 space-y-2">
                    {(operations?.ordersCreated || []).map((item) => (
                      <div key={item.date} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                        <span className="text-sm text-slate-300">{item.date}</span>
                        <span className="font-black text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              <article className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Inventario</h3>
                <div className="mt-4 text-sm text-slate-400">
                  Productos con bajo stock: <span className="font-black text-white">{inventory?.lowStockProducts.length ?? 0}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {(inventory?.lowStockProducts || []).slice(0, 6).map((product) => (
                    <div key={product.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
                      <span className="text-white">{product.sku} - {product.name}</span>
                      <span className="text-red-300 font-black">{Number(product.current_stock).toFixed(2)} / {Number(product.min_stock).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="text-sm font-bold text-slate-300">Movimientos recientes</div>
                  <div className="mt-3 space-y-2 max-h-80 overflow-auto pr-1">
                    {(inventory?.recentMovements || []).map((movement) => (
                      <div key={movement.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-white">{movement.movement_type}</span>
                          <span>{movement.quantity}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{movement.created_at}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Compras por proveedor</h3>
                <div className="mt-4 space-y-2">
                  {(purchasesExpenses?.purchasesBySupplier || []).map((item) => (
                    <div key={item.supplier_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <div>
                        <div className="font-bold text-white">{item.supplier_name}</div>
                        <div className="text-slate-500">{item.count} compras</div>
                      </div>
                      <div className="font-black text-white">{formatCurrency(item.total_amount_cents)}</div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Gastos por categoría</h3>
                <div className="mt-4 space-y-2">
                  {(purchasesExpenses?.expensesByCategory || []).map((item) => (
                    <div key={item.category_id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <div>
                        <div className="font-bold text-white">{item.category_name}</div>
                        <div className="text-slate-500">{item.count} gastos</div>
                      </div>
                      <div className="font-black text-white">{formatCurrency(item.total_amount_cents)}</div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {finance?.notes?.length ? (
              <section className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Limitaciones / notas</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-400 list-disc pl-5">
                  {finance.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </SaasShell>
  );
}
