'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Search, RefreshCw, Trash2, Calendar, DollarSign, X } from 'lucide-react';
import { fixService } from '@/services/fixService';
import { getActiveSucursalId } from '@/lib/tenant';

type ExpenseRow = {
  id?: string;
  amount?: number;
  expense?: number;
  category?: string;
  description?: string | null;
  concept?: string | null;
  created_at?: string;
  expense_date?: string;
};

type ExpenseForm = {
  amount: string;
  description: string;
  category: string;
  date: string;
};

const INITIAL_FORM: ExpenseForm = {
  amount: '',
  description: '',
  category: 'operativo',
  date: new Date().toISOString().slice(0, 10),
};

export default function GastosPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(INITIAL_FORM);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await fixService.getExpenses();
      const expensesList = data as ExpenseRow[];
      setExpenses(expensesList);
      setError('');
    } catch (err) {
      setExpenses([]);
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpenses();
  }, []);

  useEffect(() => {
    let filtered = [...expenses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((e) =>
        [e.description ?? '', e.concept ?? '', e.category ?? ''].join(' ').toLowerCase().includes(term)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter((e) => String(e.expense_date ?? e.created_at ?? '') >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((e) => String(e.expense_date ?? e.created_at ?? '') <= dateTo);
    }

    filtered.sort((a, b) => new Date(String(b.expense_date ?? b.created_at ?? '')).getTime() - new Date(String(a.expense_date ?? a.created_at ?? '')).getTime());
    setFilteredExpenses(filtered);
    setTotalAmount(filtered.reduce((sum, e) => sum + Number(e.expense ?? e.amount ?? 0), 0));
  }, [searchTerm, dateFrom, dateTo, expenses]);

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeSucursalId = getActiveSucursalId();
    if (!activeSucursalId || activeSucursalId === 'GLOBAL') {
      setError('Selecciona una sucursal activa para registrar gastos.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await fixService.createExpense({
        sucursalId: activeSucursalId,
        amount: Number(form.amount),
        description: form.description.trim(),
        category: form.category.trim(),
        date: form.date,
      });
      setShowForm(false);
      setForm(INITIAL_FORM);
      await loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el gasto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(expense: ExpenseRow) {
    if (!expense.id) return;
    if (!window.confirm(`¿Eliminar el gasto "${expense.description ?? expense.concept ?? expense.id}"?`)) return;
    try {
      setError('');
      await fixService.deleteExpense(expense.id);
      await loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el gasto');
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-orbitron font-bold text-srf-primary">Gastos</h1>
          <p className="text-srf-muted text-sm mt-1">
            Total: <span className="font-bold text-srf-accent">${totalAmount.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm((value) => !value)}
          className="btn-primary gap-2 inline-flex items-center"
        >
          <Plus className="w-4 h-4" />
          Nuevo gasto
        </button>
      </div>

      {error ? <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

      {showForm ? (
        <form onSubmit={submitExpense} className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-srf-primary">Registrar gasto</h2>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost inline-flex items-center gap-2 text-srf-muted">
              <X className="w-4 h-4" />
              Cerrar
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input value={form.date} onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))} className="input" type="date" required />
            <input value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="input" placeholder="Categoría" required />
            <input value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} className="input md:col-span-2" placeholder="Descripción" required />
            <input value={form.amount} onChange={(e) => setForm((current) => ({ ...current, amount: e.target.value }))} className="input" type="number" step="0.01" min="0" placeholder="Monto" required />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar gasto'}</button>
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-srf-muted" />
          <input
            placeholder="Buscar por concepto o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9"
          />
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="input w-40"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="input w-40"
        />
        <button
          onClick={() => void loadExpenses()}
          className="btn-outline gap-2 inline-flex items-center"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-srf-surface border-b border-srf-primary/30">
            <tr>
              <th className="text-left py-3 px-4">Fecha</th>
              <th className="text-left py-3 px-4">Categoría</th>
              <th className="text-left py-3 px-4">Concepto</th>
              <th className="text-right py-3 px-4">Monto</th>
              <th className="text-left py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="border-b border-srf-primary/20 hover:bg-srf-surface/50">
                <td className="py-3 px-4">{formatDate(expense.expense_date ?? expense.created_at)}</td>
                <td className="py-3 px-4">{expense.category ?? 'operativo'}</td>
                <td className="py-3 px-4">
                  <div className="font-medium">{expense.description ?? expense.concept ?? 'Gasto'}</div>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-srf-accent">
                  ${Number(expense.expense ?? expense.amount ?? 0).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => void handleDelete(expense)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-srf-muted">No hay gastos con esos filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
