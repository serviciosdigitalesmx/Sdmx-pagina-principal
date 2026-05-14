import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@srfix/database';

const createExpenseSchema = z.object({
  sucursalId: z.string().min(1, 'sucursalId is required'),
  amount: z.number().positive('amount must be positive'),
  description: z.string().min(1, 'description is required'),
  category: z.string().min(1, 'category is required'),
  date: z.string().optional(),
});

export const getBalance = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can access global balance' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('finances')
      .select('id, tenant_id, balance, income, expense, created_at')
      .eq('tenant_id', tenantId);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch balance', details: error.message });
    }

    return res.json({ success: true, data });
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
    const { data, error } = await supabase
      .from('finances')
      .select('id, tenant_id, sucursal_id, balance, income, expense, created_at')
      .eq('tenant_id', tenantId)
      .eq('sucursal_id', sucursalId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch cashflow', details: error.message });
    }

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

    if (req.user?.role === 'manager' && tokenSucursalId && body.sucursalId !== tokenSucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          tenant_id: tenantId,
          sucursal_id: body.sucursalId,
          amount: body.amount,
          description: body.description,
          category: body.category,
          date: body.date ?? new Date().toISOString(),
          created_by: req.user?.sub,
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
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', expenseId)
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch expense', details: error.message });
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
      .from('expenses')
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
      .from('expenses')
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
