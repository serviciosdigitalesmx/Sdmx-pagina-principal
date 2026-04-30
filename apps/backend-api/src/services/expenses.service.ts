import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  CreateExpenseCategoryRequestDto,
  CreateExpenseRequestDto,
  ExpenseCategoryDto,
  ExpenseDto
} from '@sdmx/contracts';

const nowIso = () => new Date().toISOString();
const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

export const expensesService = {
  async listCategories(token: string): Promise<ExpenseCategoryDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<ExpenseCategoryDto[]>(`expense_categories?order=updated_at.desc&select=*`, token);
  },

  async createCategory(token: string, request: CreateExpenseCategoryRequestDto): Promise<ExpenseCategoryDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    assert(Boolean(request.name?.trim()), 'name es obligatorio');

    const created = await supabase.insert<ExpenseCategoryDto[]>('expense_categories', token, {
      id: randomUUID(),
      tenant_id: tenantId,
      name: request.name.trim(),
      description: request.description?.trim() || null,
      created_at: nowIso(),
      updated_at: nowIso()
    });

    await this.audit(token, 'expense_category.created', created[0] ?? {});
    return created[0];
  },

  async listExpenses(token: string): Promise<ExpenseDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    return supabase.query<ExpenseDto[]>(
      `expenses?order=expense_date.desc,created_at.desc&select=*,category:expense_categories(*)`,
      token
    );
  },

  async getExpenseById(token: string, expenseId: string): Promise<ExpenseDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const expenses = await supabase.query<ExpenseDto[]>(
      `expenses?id=eq.${encodeURIComponent(expenseId)}&select=*,category:expense_categories(*)`,
      token
    );
    const expense = expenses[0];
    assert(Boolean(expense), 'Gasto no encontrado');
    return expense;
  },

  async createExpense(token: string, request: CreateExpenseRequestDto): Promise<ExpenseDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);

    assert(Boolean(request.categoryId), 'categoryId es obligatorio');
    assert(Boolean(request.description?.trim()), 'description es obligatorio');
    assert(Number(request.amountCents) >= 0, 'amountCents debe ser mayor o igual a 0');

    const category = await supabase.query<ExpenseCategoryDto[]>(
      `expense_categories?id=eq.${encodeURIComponent(request.categoryId)}&select=*`,
      token
    );
    assert(Boolean(category[0]), 'Categoría no encontrada');
    assert(String(category[0].tenant_id) === tenantId, 'Categoría fuera del tenant');

    const created = await supabase.insert<ExpenseDto[]>('expenses', token, {
      id: randomUUID(),
      tenant_id: tenantId,
      category_id: request.categoryId,
      expense_date: request.expenseDate || new Date().toISOString().slice(0, 10),
      description: request.description.trim(),
      amount_cents: Math.trunc(Number(request.amountCents)),
      payment_method: request.paymentMethod?.trim() || 'cash',
      reference: request.reference?.trim() || null,
      notes: request.notes?.trim() || null,
      created_at: nowIso(),
      updated_at: nowIso()
    });

    await this.audit(token, 'expense.created', created[0] ?? {});
    return created[0];
  },

  async deleteExpense(token: string, expenseId: string): Promise<{ deleted: true }> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const expense = await this.getExpenseById(token, expenseId);
    const tenantId = resolveTenantIdFromSession(session);

    const res = await fetch(`${env.supabaseUrl}/rest/v1/expenses?id=eq.${encodeURIComponent(expenseId)}&tenant_id=eq.${encodeURIComponent(tenantId)}`, {
      method: 'DELETE',
      headers: {
        apikey: env.supabaseAnonKey,
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        Prefer: 'return=minimal'
      }
    });
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Supabase error ${res.status}`);

    await this.audit(token, 'expense.deleted', expense);
    return { deleted: true };
  },

  async audit(token: string, action: string, payload: unknown): Promise<void> {
    const session = await loadSession(token);
    const tenantId = resolveTenantIdFromSession(session);
    await supabase.insert('audit_events', token, {
      tenant_id: tenantId,
      actor_user_id: session.user.id,
      action,
      payload,
      created_at: nowIso()
    });
  }
};
