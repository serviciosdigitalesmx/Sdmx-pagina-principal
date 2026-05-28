import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';

const createExpenseSchema = z.object({
  sucursalId: z.string().min(1, 'sucursalId is required'),
  amount: z.number().positive('amount must be positive'),
  description: z.string().min(1, 'description is required'),
  category: z.string().min(1, 'category is required'),
  date: z.string().optional(),
});

function toDayKey(value?: string | null) {
  return value ? value.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function resolveOrderIncome(order: { total_cost?: number | null; final_cost?: number | null }) {
  return Number(order.total_cost ?? order.final_cost ?? 0);
}

async function assertSucursalOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, sucursalId: string) {
  const { data, error } = await supabase
    .from('sucursales')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', sucursalId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function loadFinanceFacts(tenantId: string) {
  const supabase = getTenantClient(tenantId);
  const [ordersResult, expensesResult] = await Promise.all([
    supabase
      .from('service_orders')
      .select('id, tenant_id, sucursal_id, total_cost, final_cost, created_at, status')
      .eq('tenant_id', tenantId)
      .limit(1000),
    supabase
      .from('finances')
      .select('id, tenant_id, sucursal_id, balance, income, expense, created_at')
      .eq('tenant_id', tenantId)
      .limit(1000),
  ]);

  const errors = [ordersResult.error, expensesResult.error].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((item) => (item as Error).message ?? String(item)).join(', '));
  }

  return {
    orders: ordersResult.data ?? [],
    expenses: expensesResult.data ?? [],
  };
}

export const getBalance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can access global balance' });
    }

    const sucursalId = typeof req.query.sucursalId === 'string' ? req.query.sucursalId.trim() : '';
    const { orders, expenses } = await loadFinanceFacts(tenantId);

    const filteredOrders = sucursalId
      ? orders.filter((order) => String((order as { sucursal_id?: string | null }).sucursal_id ?? '') === sucursalId)
      : orders;
    const filteredExpenses = sucursalId
      ? expenses.filter((expense) => String((expense as { sucursal_id?: string | null }).sucursal_id ?? '') === sucursalId)
      : expenses;

    const totalIncome = filteredOrders.reduce((sum, order) => sum + resolveOrderIncome(order as { total_cost?: number | null; final_cost?: number | null }), 0);
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + Number((item as { expense?: number }).expense ?? 0), 0);
    const totalBalance = Number((totalIncome - totalExpense).toFixed(2));

    const rows = [
      {
        id: `income-${tenantId}`,
        tenant_id: tenantId,
        balance: totalBalance,
        income: totalIncome,
        expense: totalExpense,
        created_at: new Date().toISOString(),
        type: 'summary',
      },
      ...filteredOrders.slice(0, 25).map((order) => ({
        id: String((order as { id?: string }).id ?? `${tenantId}-order`),
        tenant_id: tenantId,
        balance: resolveOrderIncome(order as { total_cost?: number | null; final_cost?: number | null }),
        income: resolveOrderIncome(order as { total_cost?: number | null; final_cost?: number | null }),
        expense: 0,
        created_at: String((order as { created_at?: string }).created_at ?? new Date().toISOString()),
        type: 'order',
      })),
      ...filteredExpenses.slice(0, 25).map((expense) => ({
        id: String((expense as { id?: string }).id ?? `${tenantId}-expense`),
        tenant_id: tenantId,
        balance: Number((expense as { balance?: number; expense?: number }).balance ?? 0),
        income: 0,
        expense: Number((expense as { expense?: number }).expense ?? 0),
        created_at: String((expense as { created_at?: string }).created_at ?? new Date().toISOString()),
        type: 'expense',
      })),
    ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getCashflow = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const sucursalId = req.params.sucursalId;

    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (!sucursalId) return res.status(400).json({ error: 'Missing sucursalId' });

    const supabase = getTenantClient(tenantId);
    if (!(await assertSucursalOwnership(supabase, tenantId, sucursalId))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { orders, expenses } = await loadFinanceFacts(tenantId);
    const sucursalOrders = orders.filter((order) => String((order as { sucursal_id?: string | null }).sucursal_id ?? '') === sucursalId);
    const sucursalExpenses = expenses.filter((expense) => String((expense as { sucursal_id?: string | null }).sucursal_id ?? '') === sucursalId);

    const grouped = new Map<string, { id: string; tenant_id: string; sucursal_id: string; balance: number; income: number; expense: number; created_at: string }>();

    for (const order of sucursalOrders) {
      const day = toDayKey((order as { created_at?: string }).created_at ?? null);
      const current = grouped.get(day) ?? { id: `${sucursalId}-${day}`, tenant_id: tenantId, sucursal_id: sucursalId, balance: 0, income: 0, expense: 0, created_at: day };
      const income = resolveOrderIncome(order as { total_cost?: number | null; final_cost?: number | null });
      current.income += income;
      current.balance += income;
      grouped.set(day, current);
    }

    for (const expense of sucursalExpenses) {
      const day = toDayKey((expense as { expense_date?: string; created_at?: string }).expense_date ?? (expense as { created_at?: string }).created_at ?? null);
      const current = grouped.get(day) ?? { id: `${sucursalId}-${day}`, tenant_id: tenantId, sucursal_id: sucursalId, balance: 0, income: 0, expense: 0, created_at: day };
      const amount = Number((expense as { expense?: number }).expense ?? 0);
      current.expense += amount;
      current.balance -= amount;
      grouped.set(day, current);
    }

    const data = [...grouped.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting cashflow:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = createExpenseSchema.parse(req.body);
    const tokenSucursalId = req.user?.sucursalId;
    const supabase = getTenantClient(tenantId);

    if (!(await assertSucursalOwnership(supabase, tenantId, body.sucursalId))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (req.user?.role === 'manager' && tokenSucursalId && body.sucursalId !== tokenSucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { data, error } = await supabase
      .from('finances')
      .insert([
        {
          tenant_id: tenantId,
          sucursal_id: body.sucursalId,
          balance: Number((-body.amount).toFixed(2)),
          income: 0,
          expense: body.amount,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to create expense', details: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const expenseId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (!expenseId) return res.status(400).json({ error: 'Missing expense id' });

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('finances')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', expenseId)
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch expense', details: error.message });
    }

    if (data?.sucursal_id && !(await assertSucursalOwnership(supabase, tenantId, data.sucursal_id))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (req.user?.role === 'manager' && req.user.sucursalId && data.sucursal_id !== req.user.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting expense:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const expenseId = req.params.id;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (!expenseId) return res.status(400).json({ error: 'Missing expense id' });

    const supabase = getTenantClient(tenantId);
    const lookup = await supabase
      .from('finances')
      .select('id, sucursal_id')
      .eq('tenant_id', tenantId)
      .eq('id', expenseId)
      .single();

    if (lookup.error) {
      return res.status(502).json({ error: 'Failed to fetch expense', details: lookup.error.message });
    }

    if (req.user?.role === 'manager' && req.user.sucursalId && lookup.data.sucursal_id !== req.user.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { error } = await supabase
      .from('finances')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', expenseId);

    if (error) {
      return res.status(502).json({ error: 'Failed to delete expense', details: error.message });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
