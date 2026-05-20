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
      .from('inventory')
      .select('id, tenant_id, sku, description, stock, branch_id, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch procurement summary', details: error.message });
    }

    const items = Array.isArray(data) ? data : [];
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
    const lowStockItems = items.filter((item) => Number(item.stock ?? 0) <= lowStockThreshold);
    const totalStock = items.reduce((sum, item) => sum + Number(item.stock ?? 0), 0);

    return res.json({
      success: true,
      data: {
        totalItems: items.length,
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
