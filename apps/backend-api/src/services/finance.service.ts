import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  FinanceMonthlyDto,
  FinanceSummaryDto,
  FinanceTransactionDto,
  ReportDateRangeDto
} from '@sdmx/contracts';

type QueryRange = { from?: string | null; to?: string | null };

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

function parseDate(value: string | null | undefined, field: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Fecha inválida en ${field}`);
  return new Date(parsed).toISOString();
}

function normalizeRange(range: QueryRange): ReportDateRangeDto {
  return { from: range.from ?? null, to: range.to ?? null };
}

function buildDateFilters(from?: string | null, to?: string | null, column = 'created_at'): string {
  const parts: string[] = [];
  if (from) parts.push(`${column}=gte.${encodeURIComponent(from)}`);
  if (to) parts.push(`${column}=lte.${encodeURIComponent(to)}`);
  return parts.length > 0 ? `&${parts.join('&')}` : '';
}

function monthKey(dateValue: string): string {
  return String(dateValue).slice(0, 7);
}

export const financeService = {
  async summary(token: string, range: QueryRange): Promise<FinanceSummaryDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const createdFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;
    const expenseFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'expense_date')}`;

    const [quotes, orders, expenses, purchases] = await Promise.all([
      supabase.query<Array<{ total_mxn?: number | null; balance_mxn?: number | null; status?: string }>>(
        `quotations?${createdFilters}&select=total_mxn,balance_mxn,status,created_at`,
        token
      ),
      supabase.query<Array<{ estimated_cost?: number | null }>>(
        `service_orders?${createdFilters}&select=estimated_cost,created_at`,
        token
      ),
      supabase.query<Array<{ amount_cents?: number | null }>>(
        `expenses?${expenseFilters}&select=amount_cents,expense_date`,
        token
      ),
      supabase.query<Array<{ total_amount_cents?: number | null; status?: string }>>(
        `purchase_orders?${createdFilters}&select=total_amount_cents,status,created_at`,
        token
      )
    ]);

    const approvedQuoteRevenue = quotes.filter((quote) => String(quote.status || '').toLowerCase() === 'approved');
    const quoteRevenue = approvedQuoteRevenue.reduce((acc, quote) => acc + Number(quote.total_mxn ?? 0), 0);
    const quoteReceivables = approvedQuoteRevenue.reduce((acc, quote) => acc + Number(quote.balance_mxn ?? 0), 0);
    const orderRevenue = orders.reduce((acc, order) => acc + Number(order.estimated_cost ?? 0), 0);
    const incomeMxn = quoteRevenue > 0 ? quoteRevenue : orderRevenue;
    const revenueSource: FinanceSummaryDto['revenueSource'] =
      quoteRevenue > 0 && orderRevenue > 0 ? 'mixed' : quoteRevenue > 0 ? 'quotations.total_mxn' : orderRevenue > 0 ? 'service_orders.estimated_cost' : 'none';

    const totalExpensesCents = expenses.reduce((acc, expense) => acc + Math.trunc(Number(expense.amount_cents ?? 0)), 0);
    const totalPurchasesCents = purchases
      .filter((purchase) => String(purchase.status || '').toLowerCase() === 'confirmed')
      .reduce((acc, purchase) => acc + Math.trunc(Number(purchase.total_amount_cents ?? 0)), 0);
    const totalIncomeCents = Math.trunc(Number(incomeMxn) * 100);
    const accountsReceivableCents = Math.trunc(Number(quoteReceivables) * 100);
    const balanceCents = totalIncomeCents + accountsReceivableCents - totalExpensesCents - totalPurchasesCents;

    const notes: string[] = [];
    if (quoteRevenue === 0 && orderRevenue === 0) notes.push('No hay ingresos estimables en el rango.');
    if (quoteReceivables > 0) notes.push('Cuentas por cobrar calculadas desde quotations.balance_mxn aprobado.');

    return {
      range: normalizeRange({ from, to }),
      totalIncomeCents,
      totalExpensesCents,
      totalPurchasesCents,
      accountsReceivableCents,
      balanceCents,
      revenueSource,
      notes
    };
  },

  async monthly(token: string, range: QueryRange): Promise<FinanceMonthlyDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const createdFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;
    const expenseFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'expense_date')}`;

    const [quotes, orders, expenses, purchases] = await Promise.all([
      supabase.query<Array<{ total_mxn?: number | null; balance_mxn?: number | null; status?: string; created_at: string }>>(
        `quotations?${createdFilters}&select=total_mxn,balance_mxn,status,created_at`,
        token
      ),
      supabase.query<Array<{ estimated_cost?: number | null; created_at: string }>>(
        `service_orders?${createdFilters}&select=estimated_cost,created_at`,
        token
      ),
      supabase.query<Array<{ amount_cents?: number | null; expense_date: string }>>(
        `expenses?${expenseFilters}&select=amount_cents,expense_date`,
        token
      ),
      supabase.query<Array<{ total_amount_cents?: number | null; status?: string; created_at: string }>>(
        `purchase_orders?${createdFilters}&select=total_amount_cents,status,created_at`,
        token
      )
    ]);

    const monthMap = new Map<string, { income: number; expenses: number; purchases: number; receivables: number }>();

    const ensure = (month: string) => {
      if (!monthMap.has(month)) monthMap.set(month, { income: 0, expenses: 0, purchases: 0, receivables: 0 });
      return monthMap.get(month)!;
    };

    for (const quote of quotes.filter((item) => String(item.status || '').toLowerCase() === 'approved')) {
      const bucket = ensure(monthKey(quote.created_at));
      bucket.income += Math.trunc(Number(quote.total_mxn ?? 0) * 100);
      bucket.receivables += Math.trunc(Number(quote.balance_mxn ?? 0) * 100);
    }
    for (const order of orders) {
      const bucket = ensure(monthKey(order.created_at));
      bucket.income += Math.trunc(Number(order.estimated_cost ?? 0) * 100);
    }
    for (const expense of expenses) {
      const bucket = ensure(monthKey(expense.expense_date));
      bucket.expenses += Math.trunc(Number(expense.amount_cents ?? 0));
    }
    for (const purchase of purchases.filter((item) => String(item.status || '').toLowerCase() === 'confirmed')) {
      const bucket = ensure(monthKey(purchase.created_at));
      bucket.purchases += Math.trunc(Number(purchase.total_amount_cents ?? 0));
    }

    return {
      range: normalizeRange({ from, to }),
      months: [...monthMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, values]) => ({
          month,
          incomeCents: values.income,
          expensesCents: values.expenses,
          purchasesCents: values.purchases,
          receivablesCents: values.receivables,
          balanceCents: values.income + values.receivables - values.expenses - values.purchases
        }))
    };
  },

  async transactions(token: string, range: QueryRange): Promise<FinanceTransactionDto[]> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const createdFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;
    const expenseFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'expense_date')}`;

    const [quotes, orders, expenses, purchases] = await Promise.all([
      supabase.query<Array<{ id: string; total_mxn?: number | null; balance_mxn?: number | null; status?: string; created_at: string }>>(
        `quotations?${createdFilters}&select=id,total_mxn,balance_mxn,status,created_at`,
        token
      ),
      supabase.query<Array<{ id: string; estimated_cost?: number | null; created_at: string; status: string }>>(
        `service_orders?${createdFilters}&select=id,estimated_cost,created_at,status`,
        token
      ),
      supabase.query<Array<{ id: string; amount_cents?: number | null; expense_date: string; description: string; payment_method: string; category_id: string }>>(
        `expenses?${expenseFilters}&select=id,amount_cents,expense_date,description,payment_method,category_id`,
        token
      ),
      supabase.query<Array<{ id: string; total_amount_cents?: number | null; status?: string; created_at: string; supplier_id: string }>>(
        `purchase_orders?${createdFilters}&select=id,total_amount_cents,status,created_at,supplier_id`,
        token
      )
    ]);

    const [suppliers, categories] = await Promise.all([
      supabase.query<Array<{ id: string; name: string }>>(`suppliers?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,name`, token),
      supabase.query<Array<{ id: string; name: string }>>(`expense_categories?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,name`, token)
    ]);

    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    const transactions: FinanceTransactionDto[] = [];

    for (const quote of quotes) {
      if (String(quote.status || '').toLowerCase() !== 'approved') continue;
      transactions.push({
        id: `quote-${quote.id}`,
        type: 'revenue',
        source: 'quotation',
        reference_id: quote.id,
        description: 'Cotización aprobada',
        amount_cents: Math.trunc(Number(quote.total_mxn ?? 0) * 100),
        currency: 'MXN',
        date: quote.created_at,
        category: 'ventas'
      });
      const receivable = Math.trunc(Number(quote.balance_mxn ?? 0) * 100);
      if (receivable > 0) {
        transactions.push({
          id: `receivable-${quote.id}`,
          type: 'receivable',
          source: 'quotation',
          reference_id: quote.id,
          description: 'Saldo pendiente de cotización',
          amount_cents: receivable,
          currency: 'MXN',
          date: quote.created_at,
          category: 'cuentas_por_cobrar'
        });
      }
    }

    for (const order of orders) {
      const amount = Math.trunc(Number(order.estimated_cost ?? 0) * 100);
      if (amount <= 0) continue;
      transactions.push({
        id: `order-${order.id}`,
        type: 'revenue',
        source: 'service_order',
        reference_id: order.id,
        description: `Orden ${order.status}`,
        amount_cents: amount,
        currency: 'MXN',
        date: order.created_at,
        category: 'ordenes'
      });
    }

    for (const expense of expenses) {
      transactions.push({
        id: `expense-${expense.id}`,
        type: 'expense',
        source: 'expense',
        reference_id: expense.id,
        description: expense.description,
        amount_cents: Math.trunc(Number(expense.amount_cents ?? 0)),
        currency: 'MXN',
        date: expense.expense_date,
        category: categoryMap.get(expense.category_id) || expense.category_id
      });
    }

    for (const purchase of purchases.filter((item) => String(item.status || '').toLowerCase() === 'confirmed')) {
      transactions.push({
        id: `purchase-${purchase.id}`,
        type: 'purchase',
        source: 'purchase_order',
        reference_id: purchase.id,
        description: `Compra confirmada ${supplierMap.get(purchase.supplier_id) || purchase.supplier_id}`,
        amount_cents: Math.trunc(Number(purchase.total_amount_cents ?? 0)),
        currency: 'MXN',
        date: purchase.created_at,
        category: 'compras'
      });
    }

    return transactions.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
};
