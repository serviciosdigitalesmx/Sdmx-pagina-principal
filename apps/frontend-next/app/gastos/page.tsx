'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Plus, Receipt, RefreshCw, Trash2 } from 'lucide-react';
import { SaasShell } from '@/components/ui/SaasShell';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { ExpenseCategoryDto, ExpenseDto } from '@sdmx/contracts';

type CategoryForm = {
  name: string;
  description: string;
};

type ExpenseForm = {
  categoryId: string;
  expenseDate: string;
  description: string;
  amountCents: string;
  paymentMethod: string;
  reference: string;
  notes: string;
};

const emptyCategoryForm: CategoryForm = { name: '', description: '' };
const emptyExpenseForm: ExpenseForm = {
  categoryId: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  description: '',
  amountCents: '',
  paymentMethod: 'cash',
  reference: '',
  notes: ''
};

export default function GastosPage() {
  const { session, loading: authLoading } = useAuth();
  const [tenantId, setTenantId] = useState('');

  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  useEffect(() => {
    setTenantId(session?.shop?.id || '');
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [categoriesRes, expensesRes] = await Promise.all([
        apiClient.get<ExpenseCategoryDto[]>('/api/expense-categories'),
        apiClient.get<ExpenseDto[]>('/api/expenses')
      ]);

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
        if (!expenseForm.categoryId && categoriesRes.data[0]?.id) {
          setExpenseForm((current) => ({ ...current, categoryId: categoriesRes.data?.[0]?.id || current.categoryId }));
        }
      }

      if (expensesRes.success && expensesRes.data) {
        setExpenses(expensesRes.data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    void loadData();
  }, [authLoading, tenantId]);

  const createCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post<ExpenseCategoryDto>('/api/expense-categories', {
        tenantId,
        name: categoryForm.name,
        description: categoryForm.description || null
      });
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo crear la categoría');
      setCategoryForm(emptyCategoryForm);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la categoría');
    } finally {
      setSaving(false);
    }
  };

  const createExpense = async (event: FormEvent) => {
    event.preventDefault();
    if (!tenantId) {
      setError('No se pudo resolver el tenant activo');
      return;
    }
    if (!expenseForm.categoryId) {
      setError('Selecciona una categoría');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post<ExpenseDto>('/api/expenses', {
        tenantId,
        categoryId: expenseForm.categoryId,
        expenseDate: expenseForm.expenseDate,
        description: expenseForm.description,
        amountCents: Number(expenseForm.amountCents),
        paymentMethod: expenseForm.paymentMethod,
        reference: expenseForm.reference || null,
        notes: expenseForm.notes || null
      });
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo crear el gasto');
      setExpenseForm({ ...emptyExpenseForm, categoryId: expenseForm.categoryId });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el gasto');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.delete<{ deleted: true }>(`/api/expenses/${expenseId}`);
      if (!response.success || !response.data) throw new Error(response.error?.message || 'No se pudo eliminar el gasto');
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el gasto');
    } finally {
      setSaving(false);
    }
  };

  const totalExpensesCents = expenses.reduce((acc, expense) => acc + Number(expense.amount_cents || 0), 0);

  return (
    <SaasShell title="Gastos" subtitle="Registro real de egresos por categoría y tenant.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="srf-card p-6 md:p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Gastos</h2>
                <p className="text-slate-500 text-sm">Categorías y egresos persistidos en Supabase.</p>
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
                <div key={item} className="h-24 animate-pulse rounded-3xl border border-white/5 bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const category = categoryMap.get(expense.category_id);
                return (
                  <article key={expense.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{expense.expense_date}</div>
                        <h3 className="mt-2 text-lg font-black text-white">{expense.description}</h3>
                        <p className="mt-1 text-sm text-slate-400">{category?.name || expense.category_id}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {expense.payment_method}
                          {expense.reference ? ` · ${expense.reference}` : ''}
                        </p>
                        {expense.notes ? <p className="mt-2 text-sm text-slate-500">{expense.notes}</p> : null}
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white">${(expense.amount_cents / 100).toFixed(2)}</div>
                        <button
                          type="button"
                          onClick={() => void deleteExpense(expense.id)}
                          disabled={saving}
                          className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
            Total egresos: <span className="font-black text-white">${(totalExpensesCents / 100).toFixed(2)}</span>
          </div>
        </section>

        <section className="space-y-6">
          <div className="srf-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Nueva categoría</h2>
                <p className="text-slate-500 text-sm">Clasificación para egresos.</p>
              </div>
            </div>

            <form onSubmit={createCategory} className="space-y-4">
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Servicios, Papelería, Impuestos..."
                required
              />
              <textarea
                value={categoryForm.description}
                onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Descripción opcional"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#1F7EDC] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                Crear categoría
              </button>
            </form>
          </div>

          <div className="srf-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">Nuevo gasto</h2>
                <p className="text-slate-500 text-sm">Monto en centavos y persistencia real.</p>
              </div>
            </div>

            <form onSubmit={createExpense} className="space-y-4">
              <select
                value={expenseForm.categoryId}
                onChange={(event) => setExpenseForm((current) => ({ ...current, categoryId: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
              >
                <option value="">Selecciona categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={expenseForm.expenseDate}
                onChange={(event) => setExpenseForm((current) => ({ ...current, expenseDate: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
              />

              <input
                value={expenseForm.description}
                onChange={(event) => setExpenseForm((current) => ({ ...current, description: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Descripción del gasto"
                required
              />

              <input
                type="number"
                min="0"
                step="1"
                value={expenseForm.amountCents}
                onChange={(event) => setExpenseForm((current) => ({ ...current, amountCents: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Monto en centavos"
                required
              />

              <input
                value={expenseForm.paymentMethod}
                onChange={(event) => setExpenseForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="cash, transfer, card..."
              />

              <input
                value={expenseForm.reference}
                onChange={(event) => setExpenseForm((current) => ({ ...current, reference: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Referencia opcional"
              />

              <textarea
                value={expenseForm.notes}
                onChange={(event) => setExpenseForm((current) => ({ ...current, notes: event.target.value }))}
                className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-blue-400/60"
                placeholder="Notas opcionales"
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#1F7EDC] px-4 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                Registrar gasto
              </button>
            </form>
          </div>
        </section>
      </div>
    </SaasShell>
  );
}
