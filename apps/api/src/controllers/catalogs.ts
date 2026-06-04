import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';
import { refreshInventoryAlert } from './stock-alerts';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
});

const createInventorySchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  stock: z.number().int().nonnegative(),
  sucursalId: z.string().min(1).optional(),
});

const updateInventorySchema = z.object({
  description: z.string().min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  sucursalId: z.string().min(1).optional().nullable(),
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

async function validateSucursalOwnership(
  supabase: ReturnType<typeof getTenantClient>,
  tenantId: string,
  sucursalId?: string | null,
) {
  if (!sucursalId) {
    return true;
  }

  const { data, error } = await supabase
    .from('sucursales')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', sucursalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function persistInventoryStock(
  supabase: ReturnType<typeof getTenantClient>,
  params: {
    tenantId: string;
    sucursalId: string | null;
    productId: string;
    stock: number;
    reference: string;
    notes: string | null;
    changedBy: string | null;
  },
) {
  const { tenantId, sucursalId, productId, stock, reference, notes, changedBy } = params;

  const { data: inventoryRow, error: inventoryError } = await supabase
    .from('sucursal_inventory')
    .upsert([
      {
        tenant_id: tenantId,
        sucursal_id: sucursalId,
        product_id: productId,
        stock_current: stock,
      },
    ], { onConflict: 'tenant_id,sucursal_id,product_id' })
    .select('id, tenant_id, sucursal_id, product_id, stock_current, created_at, updated_at')
    .single();

  if (inventoryError || !inventoryRow) {
    throw inventoryError ?? new Error('Failed to persist inventory row');
  }

  const movementPayload = {
    tenant_id: tenantId,
    branch_id: sucursalId,
    product_id: productId,
    movement_type: 'adjustment',
    quantity: stock,
    unit_cost: 0,
    reference,
    notes,
    created_by: changedBy,
  };

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert([movementPayload]);

  if (movementError) {
    throw movementError;
  }

  return inventoryRow;
}

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);
    let query = supabase
      .from('customers')
      .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    const scopedSucursalId = scope?.mode === 'branch' ? scope.sucursalId ?? '' : '';
    if (scopedSucursalId) {
      query = query.eq('sucursal_id', scopedSucursalId);
    }

    const { data, error } = await query;
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
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase.from('customers').insert([{
      tenant_id: tenantId,
      sucursal_id: scope?.sucursalId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
    }]).select('id, tenant_id, sucursal_id, name, phone, email, created_at').single();
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
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);
    const effectiveSucursalId = scope?.mode === 'branch' ? scope.sucursalId ?? '' : '';

    if (effectiveSucursalId && !(await validateSucursalOwnership(supabase, tenantId, effectiveSucursalId))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    let query = supabase
      .from('sucursal_inventory')
      .select('id, tenant_id, sucursal_id, product_id, stock_current, created_at, updated_at, products:product_id (id, sku, name, minimum_stock)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (effectiveSucursalId) {
      query = query.eq('sucursal_id', effectiveSucursalId);
    }

    const { data, error } = await query;
    if (error) return res.status(502).json({ error: 'Failed to fetch inventory', details: error.message });

    const rows = Array.isArray(data) ? data : [];
    const productIds = rows.map((row) => String((row as { product_id?: string }).product_id ?? '')).filter(Boolean);
    const { data: products, error: productsError } = productIds.length > 0
      ? await supabase.from('products').select('id, sku, name, tenant_id').eq('tenant_id', tenantId).in('id', productIds)
      : { data: [], error: null };

    if (productsError) {
      return res.status(502).json({ error: 'Failed to resolve inventory products', details: productsError.message });
    }

    const productMap = new Map((products ?? []).map((product) => [String((product as { id?: string }).id ?? ''), product]));
    const result = rows.map((row) => {
      const product = productMap.get(String((row as { product_id?: string }).product_id ?? '')) as Record<string, unknown> | undefined;
      return {
        ...row,
        sku: product?.sku ?? null,
        description: product?.name ?? null,
        stock: Number((row as { stock_current?: number }).stock_current ?? 0),
      };
    });

    return res.json({ success: true, data: result });
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
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    if (body.sucursalId && !isUuid(body.sucursalId)) {
      return res.status(400).json({ error: 'Invalid sucursalId' });
    }
    if (body.sucursalId && !(await validateSucursalOwnership(supabase, tenantId, body.sucursalId))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (scope?.mode === 'branch' && scope.sucursalId && body.sucursalId && body.sucursalId !== scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const productRow = await ensureProductCatalogRecord(supabase, tenantId, body.sku, body.description, body.description);
    const resolvedSucursalId = body.sucursalId ?? scope?.sucursalId ?? null;
    const changedBy = req.user?.userId ?? req.user?.sub ?? null;
    if (scope?.mode === 'branch' && !resolvedSucursalId) {
      return res.status(400).json({ error: 'Sucursal activa requerida' });
    }

    const inventoryRow = await persistInventoryStock(supabase, {
      tenantId,
      sucursalId: resolvedSucursalId,
      productId: productRow.id,
      stock: Number(body.stock),
      reference: 'inventory_seed',
      notes: body.description,
      changedBy,
    });

    await refreshInventoryAlert(tenantId, productRow.id, resolvedSucursalId, Number((inventoryRow as { stock_current?: number }).stock_current ?? body.stock));
    return res.status(201).json({
      success: true,
      data: {
        ...inventoryRow,
        sku: body.sku,
        description: body.description,
        stock: Number(body.stock),
      },
    });
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
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    const { data: currentRow, error: currentError } = await supabase
      .from('sucursal_inventory')
    .select('id, tenant_id, sucursal_id, product_id, stock_current, created_at, products:product_id (id, sku, name, minimum_stock)')
      .eq('tenant_id', tenantId)
      .eq('id', inventoryId)
      .single();

    if (currentError || !currentRow) {
      return res.status(404).json({ error: 'Inventory item not found', details: currentError?.message ?? 'Not found' });
    }

    const nextStock = typeof body.stock === 'number' ? body.stock : Number(currentRow.stock_current ?? 0);
    const nextSucursalId = body.sucursalId === null
      ? null
      : (body.sucursalId ?? scope?.sucursalId ?? currentRow.sucursal_id ?? null);

    if (body.sucursalId && !isUuid(body.sucursalId)) {
      return res.status(400).json({ error: 'Invalid sucursalId' });
    }
    if (body.sucursalId && !(await validateSucursalOwnership(supabase, tenantId, body.sucursalId))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (scope?.mode === 'branch' && scope.sucursalId && body.sucursalId && body.sucursalId !== scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (scope?.mode === 'branch' && !scope.sucursalId) {
      return res.status(400).json({ error: 'Sucursal activa requerida' });
    }

    if (scope?.mode === 'branch' && currentRow.sucursal_id && scope.sucursalId && currentRow.sucursal_id !== scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('id, tenant_id, sku, name')
      .eq('tenant_id', tenantId)
      .eq('id', currentRow.product_id)
      .maybeSingle();

    if (productError || !productRow) {
      return res.status(404).json({ error: 'Product not found for inventory row', details: productError?.message ?? 'Not found' });
    }

    const effectiveSucursalId = scope?.mode === 'branch' ? (scope.sucursalId ?? currentRow.sucursal_id ?? nextSucursalId) : nextSucursalId;
    const changedBy = req.user?.userId ?? req.user?.sub ?? null;

    const updatedRow = await persistInventoryStock(supabase, {
      tenantId,
      sucursalId: effectiveSucursalId,
      productId: productRow.id,
      stock: nextStock,
      reference: body.note || 'stock_adjustment',
      notes: body.note || null,
      changedBy,
    });

    await refreshInventoryAlert(tenantId, productRow.id, effectiveSucursalId, Number((updatedRow as { stock_current?: number }).stock_current ?? nextStock));

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
    const inventoryId = req.params.id;
    const supabase = getTenantClient(tenantId);

    const { data: inventoryRow, error: inventoryError } = await supabase
      .from('sucursal_inventory')
      .select('id, tenant_id, product_id, stock_current, sucursal_id')
      .eq('tenant_id', tenantId)
      .eq('id', inventoryId)
      .maybeSingle();

    if (inventoryError) {
      return res.status(502).json({ error: 'Failed to fetch inventory item', details: inventoryError.message });
    }

    if (inventoryRow?.sucursal_id && !(await validateSucursalOwnership(supabase, tenantId, inventoryRow.sucursal_id))) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    if (!inventoryRow) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (req.scope?.mode === 'branch' && req.scope.sucursalId && inventoryRow.sucursal_id && inventoryRow.sucursal_id !== req.scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('id, tenant_id, sku, name')
      .eq('tenant_id', tenantId)
      .eq('id', inventoryRow.product_id)
      .maybeSingle();

    if (productError) {
      return res.status(502).json({ error: 'Failed to resolve product catalog row', details: productError.message });
    }

    const { data, error } = await supabase
      .from('inventory_movements')
      .select('id, tenant_id, sucursal_id, product_id, service_order_id, purchase_order_id, movement_type, quantity, unit_cost, reference, notes, created_by, created_at')
      .eq('tenant_id', tenantId)
      .eq('product_id', productRow?.id ?? inventoryId)
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
