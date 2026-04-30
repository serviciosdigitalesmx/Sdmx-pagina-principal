"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { apiFetch, DashboardHeader } from "../../../lib/runtime.js";

type Expense = { id: string; description: string; amount: number; expense_date: string; category?: string };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<{ totalIncome: number; totalExpenses: number; netProfit: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [form, setForm] = useState({ description: "", amount: "", expenseDate: "", category: "" });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const [items, summaryData, categoriesData] = await Promise.all([
      apiFetch("/v1/expenses"),
      apiFetch("/v1/expenses/summary"),
      apiFetch("/v1/expenses/categories/list")
    ]);
    setExpenses(items.data ?? []);
    setSummary(summaryData);
    setCategories(categoriesData ?? []);
  };

  useEffect(() => {
    void load().catch((err) => setError(err.message));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/v1/expenses", {
        method: "POST",
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          expenseDate: form.expenseDate || undefined,
          category: form.category || undefined
        })
      });
      setForm({ description: "", amount: "", expenseDate: "", category: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <main className="shell">
      <DashboardHeader title="Gastos" subtitle="Control financiero del taller." />
      {summary ? (
        <div className="cards section">
          <div className="card"><strong>Ingresos</strong><p>${summary.totalIncome.toFixed(2)}</p></div>
          <div className="card"><strong>Gastos</strong><p>${summary.totalExpenses.toFixed(2)}</p></div>
          <div className="card"><strong>Utilidad</strong><p>${summary.netProfit.toFixed(2)}</p></div>
        </div>
      ) : null}
      <div className="grid-2 section">
        <form className="card stack" onSubmit={submit}>
          <h2>Nuevo gasto</h2>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción" />
          <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Monto" />
          <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
          <input list="expense-categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Categoría" />
          <datalist id="expense-categories">
            {categories.map((category) => <option key={category} value={category} />)}
          </datalist>
          {error ? <p>{error}</p> : null}
          <button type="submit">Guardar</button>
        </form>
        <div className="card stack">
          <h2>Listado</h2>
          {expenses.map((expense) => (
            <div key={expense.id} className="card">
              <strong>{expense.description}</strong>
              <div className="muted">{expense.category || "-"}</div>
              <div className="muted">{expense.expense_date}</div>
              <div>${expense.amount.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
