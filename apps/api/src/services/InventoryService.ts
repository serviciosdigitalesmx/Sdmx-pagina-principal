import { SupabaseClient } from '@supabase/supabase-js';

export class InventoryService {
  static async getInventoryMetrics(supabase: SupabaseClient, tenantId: string, sucursalId?: string) {
    let inventoryQuery = supabase
      .from('sucursal_inventory')
      .select('stock_current, products!inner(cost)')
      .eq('tenant_id', tenantId);

    if (sucursalId) {
      inventoryQuery = inventoryQuery.eq('sucursal_id', sucursalId);
    }

    const { data: inventory, error } = await inventoryQuery;
    if (error) throw error;

    let inventoryCount = 0;
    let lowStockCount = 0;
    let inventoryValuation = 0;
    
    const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);

    for (const item of inventory ?? []) {
      const stock = Number(item.stock_current ?? 0);
      const cost = Number((item.products as any)?.cost ?? 0);
      
      inventoryCount++;
      if (stock <= LOW_STOCK_THRESHOLD) {
        lowStockCount++;
      }
      inventoryValuation += (stock * cost);
    }

    return {
      inventoryCount,
      lowStockCount,
      inventoryValuation: Number(inventoryValuation.toFixed(2))
    };
  }
}
