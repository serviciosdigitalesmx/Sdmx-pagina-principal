import { SupabaseClient } from '@supabase/supabase-js';

export class CustomerService {
  static async getCustomersCount(supabase: SupabaseClient, tenantId: string, sucursalId?: string): Promise<number> {
    let query = supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    
    if (sucursalId) {
      query = query.eq('sucursal_id', sucursalId);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }
}
