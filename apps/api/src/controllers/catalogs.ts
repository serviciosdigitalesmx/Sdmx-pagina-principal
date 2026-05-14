import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@srfix/database';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  branchId: z.string().min(1).optional(),
});

const createInventorySchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  stock: z.number().int().nonnegative(),
  branchId: z.string().min(1).optional(),
});

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(502).json({ error: 'Failed to fetch customers', details: error.message });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing customers:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = createCustomerSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase.from('customers').insert([{
      tenant_id: tenantId,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      branch_id: body.branchId ?? null,
    }]).select().single();
    if (error) return res.status(502).json({ error: 'Failed to create customer', details: error.message });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listInventory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(502).json({ error: 'Failed to fetch inventory', details: error.message });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing inventory:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = createInventorySchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase.from('inventory').insert([{
      tenant_id: tenantId,
      sku: body.sku,
      description: body.description,
      stock: body.stock,
      branch_id: body.branchId ?? null,
    }]).select().single();
    if (error) return res.status(502).json({ error: 'Failed to create inventory item', details: error.message });
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error creating inventory item:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
