import { Request, Response } from 'express';
import { getTenantClient } from '@white-label/database';

export const getReportsSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);

    const [ordersResult, customersResult, inventoryResult, financeResult] = await Promise.all([
      supabase.from('service_orders').select('id, status, created_at, total_cost, final_cost').eq('tenant_id', tenantId).limit(500),
      supabase.from('customers').select('id').eq('tenant_id', tenantId).limit(500),
      supabase.from('sucursal_inventory').select('id, stock_current, product_id, sucursal_id').eq('tenant_id', tenantId).limit(500),
      supabase.from('finances').select('id, balance, income, expense, created_at').eq('tenant_id', tenantId).limit(500),
    ]);

    const errors = [ordersResult.error, customersResult.error, inventoryResult.error, financeResult.error].filter(Boolean);
    if (errors.length > 0) {
      return res.status(502).json({
        error: 'Failed to build reports summary',
        details: errors.map((item) => (item as Error).message ?? String(item)),
      });
    }

    const orders = ordersResult.data ?? [];
    const customers = customersResult.data ?? [];
    const inventory = inventoryResult.data ?? [];
    const finances = financeResult.data ?? [];

    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = String((order as { status?: string }).status ?? 'unknown').toLowerCase();
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});

    const totalIncome = orders.reduce(
      (sum, order) => sum + Number((order as { total_cost?: number | null; final_cost?: number | null }).total_cost ?? (order as { total_cost?: number | null; final_cost?: number | null }).final_cost ?? 0),
      0,
    );
    const totalExpense = finances.reduce((sum, item) => sum + Number((item as { expense?: number }).expense ?? 0), 0);
    const totalBalance = Number((totalIncome - totalExpense).toFixed(2));
    const lowStockCount = inventory.filter((item) => Number((item as { stock_current?: number }).stock_current ?? 0) <= Number(process.env.LOW_STOCK_THRESHOLD ?? 5)).length;

    return res.json({
      success: true,
      data: {
        ordersCount: orders.length,
        customersCount: customers.length,
        inventoryCount: inventory.length,
        lowStockCount,
        totalIncome,
        totalExpense,
        totalBalance,
        statusCounts,
        lastUpdatedAt: finances[0]?.created_at ?? orders[0]?.created_at ?? null,
      },
    });
  } catch (error) {
    console.error('Error getting reports summary:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
