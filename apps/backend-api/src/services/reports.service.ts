import { supabase } from './supabase.js';
import { loadSession, resolveTenantIdFromSession, requireActiveSubscription } from './context.js';
import type {
  FinanceReportDto,
  InventoryReportDto,
  OperationsReportDto,
  PurchasesExpensesReportDto,
  ReportDateRangeDto
} from '@sdmx/contracts';

type QueryRange = {
  from?: string | null;
  to?: string | null;
};

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

function normalizeRange(range: QueryRange): ReportDateRangeDto {
  return {
    from: range.from ?? null,
    to: range.to ?? null
  };
}

function parseDate(value: string | null | undefined, field: string): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Fecha inválida en ${field}`);
  return new Date(parsed).toISOString();
}

function buildDateFilters(from?: string | null, to?: string | null, column = 'created_at'): string {
  const parts: string[] = [];
  if (from) parts.push(`${column}=gte.${encodeURIComponent(from)}`);
  if (to) parts.push(`${column}=lte.${encodeURIComponent(to)}`);
  return parts.length > 0 ? `&${parts.join('&')}` : '';
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Array<{ status: string; count: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = String(row[key] ?? '');
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].map(([status, count]) => ({ status, count }));
}

export const reportsService = {
  async operations(token: string, range: QueryRange): Promise<OperationsReportDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const filters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;

    const orders = await supabase.query<Array<{ id: string; status: string; created_at: string }>>(
      `service_orders?${filters}&select=id,status,created_at&order=created_at.asc`,
      token
    );

    const grouped = new Map<string, number>();
    for (const order of orders) {
      const date = String(order.created_at).slice(0, 10);
      grouped.set(date, (grouped.get(date) || 0) + 1);
    }

    return {
      range: normalizeRange({ from, to }),
      totalOrders: orders.length,
      ordersByStatus: countBy(orders, 'status'),
      ordersCreated: [...grouped.entries()].map(([date, count]) => ({ date, count }))
    };
  },

  async finance(token: string, range: QueryRange): Promise<FinanceReportDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const createdFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;
    const expenseFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'expense_date')}`;

    const [quotes, orders, expenses, purchases] = await Promise.all([
      supabase.query<Array<{ total_mxn?: number | null }>>(`quotations?${createdFilters}&select=total_mxn,status,created_at`, token),
      supabase.query<Array<{ estimated_cost?: number | null }>>(`service_orders?${createdFilters}&select=estimated_cost,status,created_at`, token),
      supabase.query<Array<{ amount_cents?: number | null }>>(`expenses?${expenseFilters}&select=amount_cents,expense_date`, token),
      supabase.query<Array<{ total_amount_cents?: number | null; status?: string }>>(
        `purchase_orders?${createdFilters}&select=total_amount_cents,status,created_at`,
        token
      )
    ]);

    const approvedQuoteRevenue = quotes.reduce((acc, quote) => acc + Number(quote.total_mxn ?? 0), 0);
    const orderEstimatedRevenue = orders.reduce((acc, order) => acc + Number(order.estimated_cost ?? 0), 0);
    const estimatedRevenueMxn = approvedQuoteRevenue > 0 ? approvedQuoteRevenue : orderEstimatedRevenue;
    const revenueSource: FinanceReportDto['revenueSource'] =
      approvedQuoteRevenue > 0 && orderEstimatedRevenue > 0
        ? 'mixed'
        : approvedQuoteRevenue > 0
          ? 'quotations.total_mxn'
          : 'service_orders.estimated_cost';

    const totalExpensesCents = expenses.reduce((acc, expense) => acc + Math.trunc(Number(expense.amount_cents ?? 0)), 0);
    const confirmedPurchasesCents = purchases
      .filter((purchase) => String(purchase.status || '').toLowerCase() === 'confirmed')
      .reduce((acc, purchase) => acc + Math.trunc(Number(purchase.total_amount_cents ?? 0)), 0);

    const estimatedRevenueCents = Math.trunc(Number(estimatedRevenueMxn) * 100);
    const estimatedBalanceCents = estimatedRevenueCents - totalExpensesCents - confirmedPurchasesCents;

    const notes: string[] = [];
    if (approvedQuoteRevenue > 0 && orderEstimatedRevenue > 0) {
      notes.push('Se usó una fuente mixta de ingresos: cotizaciones aprobadas y órdenes con estimado.');
    } else if (approvedQuoteRevenue === 0 && orderEstimatedRevenue === 0) {
      notes.push('No hay cotizaciones aprobadas ni órdenes con estimated_cost en el rango.');
    }

    return {
      range: normalizeRange({ from, to }),
      estimatedRevenueCents,
      totalExpensesCents,
      confirmedPurchasesCents,
      estimatedBalanceCents,
      revenueSource,
      notes
    };
  },

  async inventory(token: string, range: QueryRange): Promise<InventoryReportDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const movementFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;

    const [products, movements] = await Promise.all([
      supabase.query<Array<{ id: string; sku: string; name: string; current_stock: number; min_stock: number; category?: string | null }>>(
        `inventory_products?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,sku,name,current_stock,min_stock,category&order=updated_at.desc`,
        token
      ),
      supabase.query<Array<{ id: string; product_id: string; movement_type: string; quantity: number; unit_cost_mxn?: number | null; reference_type?: string | null; reference_id?: string | null; created_at: string }>>(
        `inventory_movements?${movementFilters}&select=id,product_id,movement_type,quantity,unit_cost_mxn,reference_type,reference_id,created_at&order=created_at.desc`,
        token
      )
    ]);

    return {
      range: normalizeRange({ from, to }),
      lowStockProducts: products.filter((product) => Number(product.current_stock ?? 0) <= Number(product.min_stock ?? 0)),
      recentMovements: movements.slice(0, 20)
    };
  },

  async purchasesExpenses(token: string, range: QueryRange): Promise<PurchasesExpensesReportDto> {
    const session = await loadSession(token);
    requireActiveSubscription(session);
    const tenantId = resolveTenantIdFromSession(session);
    const from = parseDate(range.from, 'from');
    const to = parseDate(range.to, 'to');
    const createdFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'created_at')}`;
    const expenseFilters = `tenant_id=eq.${encodeURIComponent(tenantId)}${buildDateFilters(from, to, 'expense_date')}`;

    const [purchaseOrders, suppliers, expenses, categories] = await Promise.all([
      supabase.query<Array<{ supplier_id: string; status: string; total_amount_cents: number }>>(
        `purchase_orders?${createdFilters}&select=supplier_id,status,total_amount_cents`,
        token
      ),
      supabase.query<Array<{ id: string; name: string }>>(`suppliers?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,name`, token),
      supabase.query<Array<{ category_id: string; amount_cents: number }>>(
        `expenses?${expenseFilters}&select=category_id,amount_cents`,
        token
      ),
      supabase.query<Array<{ id: string; name: string }>>(`expense_categories?tenant_id=eq.${encodeURIComponent(tenantId)}&select=id,name`, token)
    ]);

    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier.name]));
    const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

    const purchasesBySupplierMap = new Map<string, { count: number; total: number }>();
    for (const purchase of purchaseOrders.filter((item) => String(item.status || '').toLowerCase() === 'confirmed')) {
      const current = purchasesBySupplierMap.get(purchase.supplier_id) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Math.trunc(Number(purchase.total_amount_cents ?? 0));
      purchasesBySupplierMap.set(purchase.supplier_id, current);
    }

    const expensesByCategoryMap = new Map<string, { count: number; total: number }>();
    for (const expense of expenses) {
      const current = expensesByCategoryMap.get(expense.category_id) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Math.trunc(Number(expense.amount_cents ?? 0));
      expensesByCategoryMap.set(expense.category_id, current);
    }

    return {
      range: normalizeRange({ from, to }),
      purchasesBySupplier: [...purchasesBySupplierMap.entries()].map(([supplier_id, value]) => ({
        supplier_id,
        supplier_name: supplierMap.get(supplier_id) || supplier_id,
        count: value.count,
        total_amount_cents: value.total
      })),
      expensesByCategory: [...expensesByCategoryMap.entries()].map(([category_id, value]) => ({
        category_id,
        category_name: categoryMap.get(category_id) || category_id,
        count: value.count,
        total_amount_cents: value.total
      }))
    };
  }
};
