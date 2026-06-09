import { SupabaseClient } from '@supabase/supabase-js';

export class FinanceService {
  static async getFinancesMetrics(supabase: SupabaseClient, tenantId: string, sucursalId?: string) {
    let financeQuery = supabase
      .from('finances')
      .select('income, expense')
      .eq('tenant_id', tenantId);

    if (sucursalId) {
      financeQuery = financeQuery.eq('sucursal_id', sucursalId);
    }

    const { data: finances, error } = await financeQuery;
    if (error) throw error;

    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of finances ?? []) {
      totalIncome += Number(item.income ?? 0);
      totalExpense += Number(item.expense ?? 0);
    }

    return {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      totalBalance: Number((totalIncome - totalExpense).toFixed(2))
    };
  }
}
