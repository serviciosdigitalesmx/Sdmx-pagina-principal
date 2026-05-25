import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
});

const createInventorySchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  stock: z.number().int().nonnegative(),
  branchId: z.string().min(1).optional(),
});

const updateInventorySchema = z.object({
  description: z.string().min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  branchId: z.string().min(1).optional().nullable(),
  note: z.string().optional().or(z.literal('')),
});

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function ensureProductCatalogRecord(
  supabase: ReturnType<typeof getTenantClient>,
  tenantId: string,
  sku: string,
  name: string,
  description?: string | null,
) {
  const { data: existingProduct, error: existingProductError } = await supabase
    .from('products')
    .select('id, tenant_id, sku, name')
    .eq('tenant_id', tenantId)
    .eq('sku', sku)
    .maybeSingle();

  if (existingProductError) {
    throw existingProductError;
  }

  if (existingProduct) {
    return existingProduct;
  }

  const { data: createdProduct, error: createProductError } = await supabase
    .from('products')
    .insert([{
      tenant_id: tenantId,
      sku,
      name,
      category: null,
      brand: null,
      compatible_model: null,
      primary_supplier_id: null,
      cost: 0,
      sale_price: 0,
      minimum_stock: 0,
      unit: null,
      location: null,
      notes: description ?? null,
      is_active: true,
    }])
    .select('id, tenant_id, sku, name')
    .single();

  if (createProductError || !createdProduct) {
    throw createProductError ?? new Error('Unable to create product catalog record');
  }

  return createdProduct;
}

async function validateBranchOwnership(
  supabase: ReturnType<typeof getTenantClient>,
  tenantId: string,
  branchId?: string | null,
) {
  if (!branchId) {
    return true;
  }

  const { data, error } = await supabase
    .from('branches')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', branchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('customers')
      .select('id, tenant_id, name, phone, email, created_at')
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
    }]).select('id, tenant_id, name, phone, email, created_at').single();
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
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId.trim() : '';
    const supabase = getTenantClient(tenantId);
    let query = supabase
      .from('inventory')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (branchId) {
      query = query.eq('branch_id', branchId);
    } else if (req.user?.role === 'manager' && req.user.sucursalId) {
      query = query.eq('branch_id', req.user.sucursalId);
    }

    const { data, error } = await query;
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

    if (body.branchId && !isUuid(body.branchId)) {
      return res.status(400).json({ error: 'Invalid branchId' });
    }
    if (body.branchId && !(await validateBranchOwnership(supabase, tenantId, body.branchId))) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const productRow = await ensureProductCatalogRecord(supabase, tenantId, body.sku, body.description, body.description);

    const { data: existingRow, error: existingError } = await supabase
      .from('inventory')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('sku', body.sku)
      .maybeSingle();

    if (existingError) return res.status(502).json({ error: 'Failed to inspect inventory item', details: existingError.message });

    if (existingRow) {
      const { data, error } = await supabase
        .from('inventory')
        .update({
          description: body.description,
          stock: body.stock,
          branch_id: body.branchId ?? null,
        })
        .eq('tenant_id', tenantId)
        .eq('sku', body.sku)
        .select()
        .single();
      if (error) return res.status(502).json({ error: 'Failed to update inventory item', details: error.message });
      return res.status(200).json({ success: true, data });
    }

    const { data, error } = await supabase.from('inventory').insert([{
      id: productRow.id,
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

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const inventoryId = req.params.id;
    const body = updateInventorySchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: currentRow, error: currentError } = await supabase
      .from('inventory')
      .select('id, tenant_id, branch_id, sku, description, stock, created_at')
      .eq('tenant_id', tenantId)
      .eq('id', inventoryId)
      .single();

    if (currentError || !currentRow) {
      return res.status(404).json({ error: 'Inventory item not found', details: currentError?.message ?? 'Not found' });
    }

    const nextStock = typeof body.stock === 'number' ? body.stock : currentRow.stock;
    const nextDescription = body.description ?? currentRow.description;
    const nextBranchId = body.branchId === null ? null : (body.branchId ?? currentRow.branch_id ?? null);

    if (body.branchId && !isUuid(body.branchId)) {
      return res.status(400).json({ error: 'Invalid branchId' });
    }
    if (body.branchId && !(await validateBranchOwnership(supabase, tenantId, body.branchId))) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const productRow = await ensureProductCatalogRecord(supabase, tenantId, currentRow.sku, nextDescription, nextDescription);

    const { data: updatedRow, error: updateError } = await supabase
      .from('inventory')
      .update({
        description: nextDescription,
        stock: nextStock,
        branch_id: nextBranchId,
      })
      .eq('tenant_id', tenantId)
      .eq('id', inventoryId)
      .select('*')
      .single();

    if (updateError) {
      return res.status(502).json({ error: 'Failed to update inventory item', details: updateError.message });
    }

    if (typeof body.stock === 'number' && body.stock !== Number(currentRow.stock ?? 0)) {
      const movementType = body.stock > Number(currentRow.stock ?? 0) ? 'in' : 'out';
      const quantity = Math.abs(body.stock - Number(currentRow.stock ?? 0));
      const { error: movementError } = await supabase.from('inventory_movements').insert([{
        tenant_id: tenantId,
        branch_id: nextBranchId,
        product_id: productRow.id,
        movement_type: movementType,
        quantity,
        unit_cost: 0,
        reference: 'stock_adjustment',
        notes: body.note || null,
        created_by: req.user?.sub ?? null,
      }]);

      if (movementError) {
        return res.status(502).json({ error: 'Failed to persist inventory movement', details: movementError.message });
      }
    }

    return res.json({ success: true, data: updatedRow });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating inventory item:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listInventoryMovements = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const productId = req.params.id;
    const supabase = getTenantClient(tenantId);

    const { data: inventoryRow, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, tenant_id, sku, description, stock, branch_id')
      .eq('tenant_id', tenantId)
      .eq('id', productId)
      .maybeSingle();

    if (inventoryError) {
      return res.status(502).json({ error: 'Failed to fetch inventory item', details: inventoryError.message });
    }

    if (!inventoryRow) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('id, tenant_id, sku, name')
      .eq('tenant_id', tenantId)
      .eq('sku', inventoryRow.sku)
      .maybeSingle();

    if (productError) {
      return res.status(502).json({ error: 'Failed to resolve product catalog row', details: productError.message });
    }

    const { data, error } = await supabase
      .from('inventory_movements')
      .select('id, tenant_id, branch_id, product_id, service_order_id, purchase_order_id, movement_type, quantity, unit_cost, reference, notes, created_by, created_at')
      .eq('tenant_id', tenantId)
      .eq('product_id', productRow?.id ?? productId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch inventory movements', details: error.message });
    }

    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error listing inventory movements:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
