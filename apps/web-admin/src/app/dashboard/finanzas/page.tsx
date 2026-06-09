'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, CircleCheckBig, Clock3, RefreshCw } from 'lucide-react';
import { fixService } from '@/services/fixService';
import { getActiveScope } from '@/lib/scope';
import type { FinanceBalance, Order } from '@/types';

function currency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value ?? 0) || 0);
}

function paymentState(order: Order) {
  const finalCost = Number(order.final_cost ?? 0);
  const estimatedCost = Number(order.estimated_cost ?? 0);
  const hasReceipt = Boolean(order.receipt_url);

  if (finalCost <= 0 && estimatedCost <= 0) {
    return { label: 'Sin cobro', tone: 'text-slate-400 border-slate-500/30 bg-slate-500/10' };
  }
  if (hasReceipt) {
    return { label: 'Cobro validado', tone: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
  }
  if (finalCost > 0) {
    return { label: 'Pendiente de validación', tone: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
  }
  return { label: 'Pendiente', tone: 'text-rose-400 border-rose-500/30 bg-rose-500/10' };
}

export default function FinanzasPage() {
  const scope = getActiveScope();
  const [rows, setRows] = useState<FinanceBalance[]>([]);
  const [cashflow, setCashflow] = useState<FinanceBalance[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const [balance, orderRows] = await Promise.all([
        fixService.getBalance(),
        fixService.getOrders(),
      ]);

      setRows((balance as unknown as FinanceBalance[]).map((row) => ({
        id: String(row.id ?? ''),
        tenant_id: String(row.tenant_id ?? ''),
        balance: Number(row.balance ?? 0),
        income: Number(row.income ?? 0),
        expense: Number(row.expense ?? 0),
        created_at: String(row.created_at ?? new Date().toISOString()),
        type: row.type,
      })));
      setOrders((orderRows as unknown as Order[]).map((row) => ({
        ...row,
        estimated_cost: Number(row.estimated_cost ?? 0),
        final_cost: Number(row.final_cost ?? 0),
        receipt_url: row.receipt_url ?? null,
      })));

      if (scope?.sucursalId) {
        const flow = await fixService.getCashflow(scope.sucursalId);
        setCashflow((flow as unknown as FinanceBalance[]).map((row) => ({
          id: String(row.id ?? ''),
          tenant_id: String(row.tenant_id ?? ''),
          balance: Number(row.balance ?? 0),
          income: Number(row.income ?? 0),
          expense: Number(row.expense ?? 0),
          created_at: String(row.created_at ?? new Date().toISOString()),
          type: row.type,
        })));
      } else {
        setCashflow([]);
      }

      setError('');
    } catch (err) {
      setRows([]);
      setCashflow([]);
      setOrders([]);
      setError(err instanceof Error ? err.message : 'Error al cargar finanzas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [scope?.sucursalId]);

  const summary = useMemo(() => {
    const summaryRow = rows.find((r) => r.type === 'summary');
    const income = Number(summaryRow?.income ?? 0);
    const expense = Number(summaryRow?.expense ?? 0);
    const balance = Number(summaryRow?.balance ?? (income - expense));

    const orderRevenue = orders.reduce((sum, order) => sum + Number(order.final_cost ?? order.estimated_cost ?? 0), 0);
    const validatedOrders = orders.filter((order) => Boolean(order.receipt_url)).length;
    const pendingOrders = orders.filter((order) => !order.receipt_url && Number(order.final_cost ?? order.estimated_cost ?? 0) > 0).length;
    
    return {
      income,
      expense,
      balance,
      orderRevenue,
      validatedOrders,
      pendingOrders,
    };
  }, [rows, orders]);

  const cashMovements = rows.slice(0, 20);
  const recentOrders = orders
    .filter((order) => Number(order.final_cost ?? order.estimated_cost ?? 0) > 0)
    .slice(0, 12);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Caja y finanzas</h1>
          <p className="mt-1 text-sm text-srf-muted">Balance real del tenant, flujo por sucursal y validación visual de cobros de órdenes</p>
        </div>
        <button onClick={() => void refresh()} className="btn-outline inline-flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-srf-muted">Ingresos</span>
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-emerald-400">{currency(summary.income)}</div>
          <div className="mt-2 text-xs text-srf-muted">Fuente: balance real del backend</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-srf-muted">Egresos</span>
            <ArrowDownRight className="h-5 w-5 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-rose-400">{currency(summary.expense)}</div>
          <div className="mt-2 text-xs text-srf-muted">Gastos y salidas reales</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-srf-muted">Balance</span>
            <Banknote className="h-5 w-5 text-srf-accent" />
          </div>
          <div className="mt-3 text-3xl font-bold text-srf-accent">{currency(summary.balance)}</div>
          <div className="mt-2 text-xs text-srf-muted">No se calcula con datos inventados</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <span className="text-srf-muted">Órdenes con cobro</span>
            <CircleCheckBig className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-cyan-400">{summary.validatedOrders}</div>
          <div className="mt-2 text-xs text-srf-muted">{summary.pendingOrders} pendientes de validación visual</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-srf-primary">Movimientos de caja</h2>
            <span className="text-xs text-srf-muted">Solo lectura desde API real</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-srf-primary/20 text-srf-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Ingreso</th>
                  <th className="px-4 py-3 text-right">Egreso</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {cashMovements.map((row) => (
                  <tr key={row.id ?? `${row.type}-${row.created_at}`} className="border-b border-srf-primary/10">
                    <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : 'Sin fecha'}</td>
                    <td className="px-4 py-3">{row.type || 'summary'}</td>
                    <td className="px-4 py-3 text-right text-emerald-400">{currency(row.income)}</td>
                    <td className="px-4 py-3 text-right text-rose-400">{currency(row.expense)}</td>
                    <td className="px-4 py-3 text-right text-srf-primary">{currency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-srf-primary">Validación de cobros</h2>
            <div className="mt-3 space-y-3">
              {recentOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-srf-primary/20 px-4 py-6 text-sm text-srf-muted">
                  No hay órdenes con importe para validar.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const state = paymentState(order);
                  return (
                    <div key={order.id} className="rounded-xl border border-srf-primary/15 bg-srf-bg/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-srf-primary">{order.folio}</div>
                          <div className="text-xs text-srf-muted">{order.device_info?.customer_name || 'Cliente sin nombre'}</div>
                        </div>
                        <span className={`rounded-full border px-2 py-0.5 text-xs ${state.tone}`}>{state.label}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-srf-muted">Importe</span>
                        <span className="font-semibold text-srf-primary">{currency(order.final_cost || order.estimated_cost || 0)}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-srf-muted">
                        <span>{order.receipt_url ? 'Recibo disponible' : 'Sin comprobante'}</span>
                        <span>{order.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-srf-primary">Flujo por sucursal</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-srf-primary/20 text-srf-muted">
                  <tr>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-right">Ingreso</th>
                    <th className="px-4 py-3 text-right">Egreso</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {cashflow.map((row) => (
                    <tr key={row.id ?? `${row.created_at}-flow`} className="border-b border-srf-primary/10">
                      <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleDateString('es-MX') : 'Sin fecha'}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{currency(row.income)}</td>
                      <td className="px-4 py-3 text-right text-rose-400">{currency(row.expense)}</td>
                      <td className="px-4 py-3 text-right text-srf-primary">{currency(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
