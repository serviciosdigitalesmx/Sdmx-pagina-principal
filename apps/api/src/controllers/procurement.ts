import { Request, Response } from 'express';
import { getTenantClient } from '@white-label/database';

export const getProcurementSummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('sucursal_inventory')
      .select('id, tenant_id, product_id, stock_current, sucursal_id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch procurement summary', details: error.message });
    }

    const items = Array.isArray(data) ? data : [];
    const productIds = items.map((item) => String((item as { product_id?: string }).product_id ?? '')).filter(Boolean);
    const { data: products, error: productsError } = productIds.length > 0
      ? await supabase.from('products').select('id, sku, name').eq('tenant_id', tenantId).in('id', productIds)
      : { data: [], error: null };

    if (productsError) {
      return res.status(502).json({ error: 'Failed to resolve procurement products', details: productsError.message });
    }

    const productMap = new Map((products ?? []).map((product) => [String((product as { id?: string }).id ?? ''), product]));
    const resolvedItems = items.map((item) => {
      const product = productMap.get(String((item as { product_id?: string }).product_id ?? '')) as Record<string, unknown> | undefined;
      return {
        ...item,
        sku: product?.sku ?? null,
        description: product?.name ?? null,
        stock: Number((item as { stock_current?: number }).stock_current ?? 0),
      };
    });
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
    const lowStockItems = resolvedItems.filter((item) => Number(item.stock ?? 0) <= lowStockThreshold);
    const totalStock = resolvedItems.reduce((sum, item) => sum + Number(item.stock ?? 0), 0);

    return res.json({
      success: true,
      data: {
        totalItems: resolvedItems.length,
        lowStockThreshold,
        lowStockCount: lowStockItems.length,
        totalStock,
        lowStockItems,
      },
    });
  } catch (error) {
    console.error('Error getting procurement summary:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
