import { Request, Response } from 'express';
import { z } from 'zod';
import { acknowledgeStockAlert, listStockAlerts, syncStockAlertForInventoryRow } from '../services/stock-alerts';

const acknowledgeSchema = z.object({
  note: z.string().optional().or(z.literal('')),
});

export const listAlerts = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const data = await listStockAlerts(tenantId);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing stock alerts:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const acknowledgeAlert = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const alertId = req.params.id;
    acknowledgeSchema.parse(req.body ?? {});
    const data = await acknowledgeStockAlert({ tenantId, alertId, userId: req.user?.sub ?? null });
    if (!data) {
      return res.status(404).json({ error: 'Stock alert not found' });
    }
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error acknowledging stock alert:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export async function refreshInventoryAlert(tenantId: string, productId: string, sucursalId: string | null | undefined, stock: number) {
  await syncStockAlertForInventoryRow({ tenantId, productId, sucursalId, stock });
}
