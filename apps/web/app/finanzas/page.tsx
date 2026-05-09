'use client';
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, RefreshCw, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { useAuthReady } from '@/lib/use-auth-ready';
import type { FinanceMonthlyDto, FinanceSummaryDto, FinanceTransactionDto } from '@sdmx/contracts';

export default function FinanzasPage() {
  const authReady = useAuthReady();
  const [today, setToday] = useState('');
  const [thirtyDaysAgo, setThirtyDaysAgo] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<FinanceSummaryDto | null>(null);
  const [monthly, setMonthly] = useState<FinanceMonthlyDto | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransactionDto[]>([]);

  useEffect(() => {
    const current = new Date();
    const todayStr = current.toISOString().slice(0, 10);
    const thirtyDaysAgoStr = new Date(current.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setToday(todayStr);
    setThirtyDaysAgo(thirtyDaysAgoStr);
    setFrom(thirtyDaysAgoStr);
    setTo(todayStr);
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return params.toString();
  }, [from, to]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(query);
    return params.toString();
  }, [query]);

  const loadFinance = async () => {
    setError('');
    try {
      const [summaryRes, monthlyRes, transactionsRes] = await Promise.allSettled([
        apiClient.get<FinanceSummaryDto>(`/api/finance/summary?${queryString}`),
        apiClient.get<FinanceMonthlyDto>(`/api/finance/monthly?${queryString}`),
        apiClient.get<FinanceTransactionDto[]>(`/api/finance/transactions?${queryString}`)
      ]);

      const messages: string[] = [];

      if (summaryRes.status === 'fulfilled' && summaryRes.value.success) {
        setSummary(summaryRes.value.data || null);
      } else {
        messages.push(summaryRes.status === 'fulfilled' ? getApiErrorMessage(summaryRes.value.error, 'No se pudo cargar resumen financiero') : 'No se pudo cargar resumen financiero');
        setSummary(null);
      }

      if (monthlyRes.status === 'fulfilled' && monthlyRes.value.success) {
        setMonthly(monthlyRes.value.data || null);
      } else {
        messages.push(monthlyRes.status === 'fulfilled' ? getApiErrorMessage(monthlyRes.value.error, 'No se pudo cargar resumen mensual') : 'No se pudo cargar resumen mensual');
        setMonthly(null);
      }

      if (transactionsRes.status === 'fulfilled' && transactionsRes.value.success) {
        setTransactions(transactionsRes.value.data || []);
      } else {
        messages.push(transactionsRes.status === 'fulfilled' ? getApiErrorMessage(transactionsRes.value.error, 'No se pudieron cargar movimientos') : 'No se pudieron cargar movimientos');
        setTransactions([]);
      }

      if (messages.length > 0) {
        setError(messages[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar finanzas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    void loadFinance();
  }, [authReady, queryString]);

  const handleRefresh = (event?: FormEvent) => {
    event?.preventDefault();
    setRefreshing(true);
    void loadFinance();
  };

  const formatMoney = (value: number) => `$${(value / 100).toFixed(2)}`;

  return (
    <SaasShell title="Finanzas" subtitle="Resumen real calculado desde órdenes, cotizaciones, compras y gastos.">
      <div className="space-y-6">
        <form onSubmit={handleRefresh} className="srf-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Filtros</h2>
                <p className="text-slate-500 text-sm">Rango de fechas del cálculo financiero.</p>
              </div>
            </div>
            <button type="submit" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white">
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
          <div className="srf-card p-8 text-slate-400">Cargando finanzas...</div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Ingresos</div>
                <div className="mt-2 text-3xl font-black text-white">{formatMoney(summary?.totalIncomeCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Reales/estimados según schema</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Egresos</div>
                <div className="mt-2 text-3xl font-black text-white">{formatMoney(summary?.totalExpensesCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Gastos registrados</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Compras</div>
                <div className="mt-2 text-3xl font-black text-white">{formatMoney(summary?.totalPurchasesCents ?? 0)}</div>
                <div className="mt-2 text-sm text-slate-400">Sólo confirmadas</div>
              </article>
              <article className="srf-card p-6">
                <div className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Balance</div>
                <div className={`mt-2 text-3xl font-black ${((summary?.balanceCents ?? 0) >= 0) ? 'text-emerald-300' : 'text-red-300'}`}>
                  {formatMoney(summary?.balanceCents ?? 0)}
                </div>
                <div className="mt-2 text-sm text-slate-400">Ingresos + CxC - egresos - compras</div>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="srf-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-xl font-black text-white">Resumen mensual</h3>
                </div>
                <div className="space-y-2">
                  {(monthly?.months || []).map((month) => (
                    <div key={month.month} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white">{month.month}</span>
                        <span className={(month.total_mxn ?? 0) >= 0 ? 'text-emerald-300 font-black' : 'text-red-300 font-black'}>{formatMoney((month.total_mxn ?? 0) * 100)}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400 md:grid-cols-4">
                        <span>Total MXN: {month.total_mxn ?? 0}</span>
                        <span>Rango: {from} - {to}</span>
                        <span>Actualizado: {today}</span>
                        <span>Periodo: 30 días</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="srf-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  <h3 className="text-xl font-black text-white">Movimientos</h3>
                </div>
                <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
                  {(transactions || []).map((txn) => (
                    <div key={txn.id} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-black text-white">{txn.description}</div>
                          <div className="mt-1 text-xs text-slate-500">{txn.date} · {txn.source}{txn.category ? ` · ${txn.category}` : ''}</div>
                        </div>
                        <div className={`font-black ${txn.type === 'expense' || txn.type === 'purchase' ? 'text-red-300' : 'text-emerald-300'}`}>
                          {txn.type === 'expense' || txn.type === 'purchase' ? '-' : '+'}{formatMoney(txn.amount_cents)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {summary?.notes?.length ? (
              <section className="srf-card p-6 md:p-8">
                <h3 className="text-xl font-black text-white">Limitaciones / notas</h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-400">
                  {summary.notes.map((note) => (
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
