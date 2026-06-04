'use client';

import { useEffect, useMemo, useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { fixService } from '@/services/fixService';
import { getActiveScope } from '@/lib/scope';

type FinanceRow = {
  id?: string;
  created_at?: string;
  type?: string;
  balance?: number | string;
  income?: number | string;
  expense?: number | string;
};

function currency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(value ?? 0) || 0);
}

export default function FinanzasPage() {
  const scope = getActiveScope();
  const [rows, setRows] = useState<FinanceRow[]>([]);
  const [cashflow, setCashflow] = useState<FinanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const balance = await fixService.getBalance();
      setRows(balance as FinanceRow[]);
      if (scope?.sucursalId) {
        const flow = await fixService.getCashflow(scope.sucursalId);
        setCashflow(flow as FinanceRow[]);
      } else {
        setCashflow([]);
      }
      setError('');
    } catch (err) {
      setRows([]);
      setCashflow([]);
      setError(err instanceof Error ? err.message : 'Error al cargar finanzas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [scope?.sucursalId]);

  const summary = useMemo(() => {
    const income = rows.reduce((sum, row) => sum + Number(row.income ?? 0), 0);
    const expense = rows.reduce((sum, row) => sum + Number(row.expense ?? 0), 0);
    return { income, expense, balance: income - expense };
  }, [rows]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="spinner w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Finanzas</h1>
          <p className="mt-1 text-sm text-srf-muted">Balance real del tenant y flujo por sucursal</p>
        </div>
        <button onClick={() => void refresh()} className="btn-outline gap-2 inline-flex items-center"><RefreshCw className="w-4 h-4" />Actualizar</button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-green-400" /><span className="text-srf-muted">Ingresos</span></div>
          <div className="mt-3 text-3xl font-bold text-green-400">{currency(summary.income)}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3"><TrendingDown className="w-5 h-5 text-red-400" /><span className="text-srf-muted">Egresos</span></div>
          <div className="mt-3 text-3xl font-bold text-red-400">{currency(summary.expense)}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3"><DollarSign className="w-5 h-5 text-srf-accent" /><span className="text-srf-muted">Balance</span></div>
          <div className="mt-3 text-3xl font-bold text-srf-accent">{currency(summary.balance)}</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-srf-primary">Movimientos recientes</h2>
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
              {rows.slice(0, 20).map((row) => (
                <tr key={row.id ?? `${row.type}-${row.created_at}`} className="border-b border-srf-primary/10">
                  <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleString('es-MX') : 'Sin fecha'}</td>
                  <td className="px-4 py-3">{row.type || 'summary'}</td>
                  <td className="px-4 py-3 text-right text-green-400">{currency(row.income)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{currency(row.expense)}</td>
                  <td className="px-4 py-3 text-right text-srf-primary">{currency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <td className="px-4 py-3 text-right text-green-400">{currency(row.income)}</td>
                  <td className="px-4 py-3 text-right text-red-400">{currency(row.expense)}</td>
                  <td className="px-4 py-3 text-right text-srf-primary">{currency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
