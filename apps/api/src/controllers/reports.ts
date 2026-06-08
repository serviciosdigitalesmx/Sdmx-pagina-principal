import { Request, Response } from 'express';
import { getTenantClient } from '@white-label/database';

export const getReportsSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const scope = req.scope;
    const requestedSucursalId = scope?.requestedSucursalId ?? '';
    const effectiveSucursalId = scope?.mode === 'branch' ? scope.sucursalId ?? requestedSucursalId : '';

    console.log('REPORTS_SUMMARY_START', {
      tenantId,
      requestedSucursalId,
      effectiveSucursalId,
    });

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);

    let ordersQuery = supabase.from('service_orders').select('id, status, created_at, final_cost, sucursal_id, promised_date, folio').eq('tenant_id', tenantId).limit(500);
    let customersQuery = supabase.from('customers').select('id, sucursal_id').eq('tenant_id', tenantId).limit(500);
    let inventoryQuery = supabase.from('sucursal_inventory').select('id, stock_current, product_id, sucursal_id, products:product_id (id, cost)').eq('tenant_id', tenantId).limit(500);
    let financeQuery = supabase.from('finances').select('id, balance, income, expense, created_at, sucursal_id').eq('tenant_id', tenantId).limit(500);
    let requestsQuery = supabase.from('service_requests').select('id, balance_amount, status, created_at').eq('tenant_id', tenantId).limit(500);
    let usersQuery = supabase.from('users').select('id, full_name, role, sucursal_id').eq('tenant_id', tenantId).limit(500);
    let movementsQuery = supabase
      .from('inventory_movements')
      .select('id, tenant_id, sucursal_id, product_id, service_order_id, movement_type, quantity, created_at, products:product_id (id, sku, name)')
      .eq('tenant_id', tenantId)
      .limit(1000);

    if (effectiveSucursalId) {
      ordersQuery = ordersQuery.eq('sucursal_id', effectiveSucursalId);
      customersQuery = customersQuery.eq('sucursal_id', effectiveSucursalId);
      inventoryQuery = inventoryQuery.eq('sucursal_id', effectiveSucursalId);
      financeQuery = financeQuery.eq('sucursal_id', effectiveSucursalId);
      usersQuery = usersQuery.eq('sucursal_id', effectiveSucursalId);
      movementsQuery = movementsQuery.eq('sucursal_id', effectiveSucursalId);
    }

    const [ordersResult, customersResult, inventoryResult, financeResult, requestsResult, usersResult, movementsResult] = await Promise.all([
      ordersQuery,
      customersQuery,
      inventoryQuery,
      financeQuery,
      requestsQuery,
      usersQuery,
      movementsQuery,
    ]);

    const errors = [ordersResult.error, customersResult.error, inventoryResult.error, financeResult.error, requestsResult.error, usersResult.error, movementsResult.error].filter(Boolean);

    console.log('REPORTS_SUMMARY_RESULTS', {
      ordersError: ordersResult.error?.message,
      customersError: customersResult.error?.message,
      inventoryError: inventoryResult.error?.message,
      financeError: financeResult.error?.message,
      requestsError: requestsResult.error?.message,
      usersError: usersResult.error?.message,
      movementsError: movementsResult.error?.message,
      ordersRows: ordersResult.data?.length,
      customersRows: customersResult.data?.length,
      inventoryRows: inventoryResult.data?.length,
      financeRows: financeResult.data?.length,
      requestsRows: requestsResult.data?.length,
      usersRows: usersResult.data?.length,
      movementsRows: movementsResult.data?.length,
    });

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
    const requests = requestsResult.data ?? [];
    const users = usersResult.data ?? [];
    const movements = movementsResult.data ?? [];
    const terminalStatuses = new Set(['entregado', 'cerrado', 'cancelado', 'finalizada']);
    const now = new Date();

    const withinToday = (value?: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      return date.toDateString() === now.toDateString();
    };

    const withinWeek = (value?: string | null) => {
      if (!value) return false;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      return diffDays >= 0 && diffDays <= 6;
    };

    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      const status = String((order as { status?: string }).status ?? 'unknown').toLowerCase();
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});

    const statusCountsToday = orders
      .filter((order) => withinToday((order as { created_at?: string | null }).created_at))
      .reduce<Record<string, number>>((acc, order) => {
        const status = String((order as { status?: string }).status ?? 'unknown').toLowerCase();
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

    const statusCountsWeek = orders
      .filter((order) => withinWeek((order as { created_at?: string | null }).created_at))
      .reduce<Record<string, number>>((acc, order) => {
        const status = String((order as { status?: string }).status ?? 'unknown').toLowerCase();
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

    const totalIncome = orders.reduce(
      (sum, order) => sum + Number((order as { final_cost?: number | null }).final_cost ?? 0),
      0,
    );
    const totalExpense = finances.reduce((sum, item) => sum + Number((item as { expense?: number }).expense ?? 0), 0);
    const totalBalance = Number((totalIncome - totalExpense).toFixed(2));
    const lowStockCount = inventory.filter((item) => Number((item as { stock_current?: number }).stock_current ?? 0) <= Number(process.env.LOW_STOCK_THRESHOLD ?? 5)).length;
    const productivity = orders.length > 0 ? Number((orders.filter((order) => String((order as { status?: string }).status ?? '').toLowerCase().includes('entreg')).length / orders.length * 100).toFixed(2)) : 0;
    const inventoryValuation = inventory.reduce((sum, item) => {
      const stock = Number((item as { stock_current?: number }).stock_current ?? 0);
      const productCost = Number(((item as { products?: { cost?: number | null } }).products?.cost ?? 0));
      return sum + (stock * productCost);
    }, 0);
    const accountsReceivable = requests.reduce((sum, item) => sum + Number((item as { balance_amount?: number }).balance_amount ?? 0), 0);
    const ordersByTechnician = users.reduce<Record<string, number>>((acc, user) => {
      const userId = String((user as { id?: string }).id ?? '');
      const displayName = String((user as { full_name?: string | null }).full_name ?? '').trim() || userId || 'sin_tecnico';
      if (!displayName) return acc;
      acc[displayName] = orders.filter((order) => String((order as { assigned_user_id?: string | null }).assigned_user_id ?? '') === userId).length;
      return acc;
    }, {});

    const ordersBySucursal = orders.reduce<Record<string, number>>((acc, order) => {
      const key = String((order as { sucursal_id?: string | null }).sucursal_id ?? 'sin_sucursal');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topProductsUsed = movements
      .filter((movement) => {
        const movementType = String((movement as { movement_type?: string | null }).movement_type ?? '').toLowerCase();
        const hasOrder = Boolean((movement as { service_order_id?: string | null }).service_order_id);
        return hasOrder && ['out', 'sal', 'consum', 'uso', 'use', 'repar'].some((needle) => movementType.includes(needle));
      })
      .reduce<Record<string, { productId: string; name: string; quantity: number }>>((acc, movement) => {
        const product = (movement as { products?: { id?: string; sku?: string | null; name?: string | null } }).products;
        const productId = String((movement as { product_id?: string | null }).product_id ?? product?.id ?? '');
        if (!productId) return acc;
        const key = product?.name?.trim() || product?.sku?.trim() || productId;
        const quantity = Number((movement as { quantity?: number | string | null }).quantity ?? 0);
        const existing = acc[key] ?? { productId, name: product?.name?.trim() || product?.sku?.trim() || 'Producto sin nombre', quantity: 0 };
        acc[key] = {
          ...existing,
          quantity: existing.quantity + (Number.isFinite(quantity) ? quantity : 0),
        };
        return acc;
      }, {});

    const topProductsUsedList = Object.values(topProductsUsed)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const overduePromisedOrders = orders
      .filter((order) => {
        const status = String((order as { status?: string | null }).status ?? '').toLowerCase();
        if (terminalStatuses.has(status)) return false;
        const promisedDate = (order as { promised_date?: string | null }).promised_date;
        if (!promisedDate) return false;
        const date = new Date(promisedDate);
        return !Number.isNaN(date.getTime()) && date.getTime() < now.getTime();
      })
      .sort((a, b) => {
        const left = new Date((a as { promised_date?: string | null }).promised_date ?? 0).getTime();
        const right = new Date((b as { promised_date?: string | null }).promised_date ?? 0).getTime();
        return left - right;
      })
      .slice(0, 5)
      .map((order) => ({
        id: (order as { id?: string }).id ?? '',
        folio: (order as { folio?: string | null }).folio ?? null,
        status: (order as { status?: string | null }).status ?? null,
        promisedDate: (order as { promised_date?: string | null }).promised_date ?? null,
        createdAt: (order as { created_at?: string | null }).created_at ?? null,
      }));

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
        productivity,
        inventoryValuation: Number(inventoryValuation.toFixed(2)),
        accountsReceivable: Number(accountsReceivable.toFixed(2)),
        ordersByTechnician,
        ordersBySucursal,
        statusCounts,
        statusCountsToday,
        statusCountsWeek,
        topProductsUsed: topProductsUsedList,
        overduePromisedOrders,
        lastUpdatedAt: finances[0]?.created_at ?? orders[0]?.created_at ?? null,
      },
    });
  } catch (error) {
    console.error('REPORTS_SUMMARY_FATAL', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
