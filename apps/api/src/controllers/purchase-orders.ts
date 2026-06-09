import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getTenantClient, supabaseAdmin } from '@white-label/database';
import { refreshInventoryAlert } from './stock-alerts';

const purchaseOrderStatusSchema = z.enum(['borrador', 'emitida', 'recepcion_parcial', 'recibida', 'cancelada']);

const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal('')),
  skuSnapshot: z.string().min(1).optional().or(z.literal('')),
  productNameSnapshot: z.string().min(1).optional().or(z.literal('')),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  sucursalId: z.string().uuid().optional().or(z.literal('')),
  expectedDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  paymentTerms: z.string().optional().or(z.literal('')),
  reference: z.string().optional().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1),
});

const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid().optional(),
  sucursalId: z.string().uuid().optional().or(z.literal('')).nullable(),
  expectedDate: z.string().optional().or(z.literal('')).nullable(),
  notes: z.string().optional().or(z.literal('')).nullable(),
  paymentTerms: z.string().optional().or(z.literal('')).nullable(),
  reference: z.string().optional().or(z.literal('')).nullable(),
});

const statusSchema = z.object({
  status: purchaseOrderStatusSchema,
  note: z.string().optional().or(z.literal('')),
});

const receiveSchema = z.object({
  notes: z.string().optional().or(z.literal('')),
  receivedItems: z.array(z.object({
    purchaseOrderItemId: z.string().uuid().optional().or(z.literal('')),
    skuSnapshot: z.string().min(1).optional().or(z.literal('')),
    quantity: z.coerce.number().positive(),
    unitCost: z.coerce.number().nonnegative().optional(),
  })).optional(),
});

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function validateSucursalOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, sucursalId?: string | null) {
  if (!sucursalId) {
    return true;
  }
  const { data, error } = await supabase
    .from('sucursales')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', sucursalId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function validateSupplierOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, supplierId: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', supplierId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

async function validateProductOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, productId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

function buildReceivedItemsPayload(
  items: Array<Record<string, unknown>>,
  receivedItems: z.infer<typeof receiveSchema>['receivedItems'],
) {
  const receivedById = new Map<string, { quantity: number; unitCost?: number }>();
  const receivedBySku = new Map<string, { quantity: number; unitCost?: number }>();

  for (const item of receivedItems ?? []) {
    const itemId = String(item.purchaseOrderItemId ?? '').trim();
    const sku = String(item.skuSnapshot ?? '').trim();
    const quantity = Number(item.quantity ?? 0);
    const unitCost = typeof item.unitCost === 'number' ? item.unitCost : undefined;
    if (itemId) {
      receivedById.set(itemId, { quantity, unitCost });
    }
    if (sku) {
      receivedBySku.set(sku, { quantity, unitCost });
    }
  }

  const usesExplicitReceipt = Boolean((receivedItems ?? []).length);

  return items.map((item) => {
    const itemId = String(item.id ?? '');
    const sku = String(item.sku_snapshot ?? '');
    const matched = receivedById.get(itemId) ?? receivedBySku.get(sku);
    const quantity = usesExplicitReceipt
      ? Number(matched?.quantity ?? 0)
      : Number(item.qty_ordered ?? 0);

    return {
      purchaseOrderItemId: itemId,
      skuSnapshot: sku || null,
      quantity,
      unitCost: Number(matched?.unitCost ?? item.unit_cost ?? 0),
    };
  });
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

async function getPurchaseOrderDetail(supabase: ReturnType<typeof getTenantClient>, tenantId: string, orderId: string) {
  const [order, items, documents] = await Promise.all([
    supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId).eq('id', orderId).maybeSingle(),
    supabase.from('purchase_order_items').select('*').eq('tenant_id', tenantId).eq('purchase_order_id', orderId).order('created_at', { ascending: true }),
    supabase.from('inventory_movements').select('id, tenant_id, sucursal_id, product_id, purchase_order_id, movement_type, quantity, unit_cost, reference, notes, created_by, created_at').eq('tenant_id', tenantId).eq('purchase_order_id', orderId).order('created_at', { ascending: true }),
  ]);

  return {
    order,
    items,
    documents,
  };
}

export const listPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);
    let query = supabase
      .from('purchase_orders')
      .select('id, tenant_id, sucursal_id, supplier_id, related_service_order_id, folio, status, reference, payment_terms, expected_date, subtotal, tax_amount, total, notes, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (scope?.mode === 'branch' && scope.sucursalId) {
      query = query.eq('sucursal_id', scope.sucursalId);
    }
    const { data, error } = await query;

    if (error) return res.status(502).json({ error: 'Failed to fetch purchase orders', details: error.message });

    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error listing purchase orders:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getPurchaseOrderById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const supabase = getTenantClient(tenantId);
    const scope = req.scope;
    const orderId = req.params.id;
    const { order, items, documents } = await getPurchaseOrderDetail(supabase, tenantId, orderId);

    if (order.error) return res.status(502).json({ error: 'Failed to fetch purchase order', details: order.error.message });
    if (!order.data) return res.status(404).json({ error: 'Purchase order not found' });
    if (scope?.mode === 'branch' && scope.sucursalId && String((order.data as { sucursal_id?: string | null }).sucursal_id ?? '') !== scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }
    if (items.error) return res.status(502).json({ error: 'Failed to fetch purchase order items', details: items.error.message });
    if (documents.error) return res.status(502).json({ error: 'Failed to fetch inventory movements', details: documents.error.message });

    return res.json({ success: true, data: { order: order.data, items: items.data ?? [], movements: documents.data ?? [] } });
  } catch (error) {
    console.error('Error getting purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const body = createPurchaseOrderSchema.parse(req.body);
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    if (!(await validateSupplierOwnership(supabase, tenantId, body.supplierId))) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    const resolvedSucursalId = body.sucursalId || (scope?.sucursalId ?? null);
    if (scope?.mode === 'branch' && !resolvedSucursalId) {
      return res.status(400).json({ error: 'Sucursal activa requerida' });
    }
    if (!(await validateSucursalOwnership(supabase, tenantId, resolvedSucursalId))) {
      return res.status(404).json({ error: 'Sucursal not found' });
    }

    const folio = `OC-${Date.now().toString(36).toUpperCase()}`;
    const subtotal = body.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
    const taxAmount = 0;
    const total = Number((subtotal + taxAmount).toFixed(2));

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert([{
        tenant_id: tenantId,
        sucursal_id: resolvedSucursalId,
        supplier_id: body.supplierId,
        folio,
        status: 'borrador',
        reference: body.reference || null,
        payment_terms: body.paymentTerms || null,
        expected_date: body.expectedDate || null,
        subtotal,
        tax_amount: taxAmount,
        total,
        notes: body.notes || null,
        created_by: null,
      }])
      .select('*')
      .single();

    if (orderError || !order) {
      return res.status(502).json({ error: 'Failed to create purchase order', details: orderError?.message ?? 'Unknown error' });
    }

    const itemRows = body.items.map((item) => ({
      id: randomUUID(),
      tenant_id: tenantId,
      purchase_order_id: order.id,
      product_id: isUuid(item.productId) ? item.productId : null,
      sku_snapshot: item.skuSnapshot || null,
      product_name_snapshot: item.productNameSnapshot || null,
      qty_ordered: Number(item.quantity),
      qty_received: 0,
      unit_cost: Number(item.unitCost),
      subtotal: Number((Number(item.quantity) * Number(item.unitCost)).toFixed(2)),
    }));

    for (const item of body.items) {
      if (typeof item.productId === 'string' && isUuid(item.productId) && !(await validateProductOwnership(supabase, tenantId, item.productId))) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }

    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemRows);
    if (itemsError) {
      return res.status(502).json({ error: 'Failed to persist purchase order items', details: itemsError.message });
    }

    return res.status(201).json({ success: true, data: { ...order, items: itemRows } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const body = updatePurchaseOrderSchema.parse(req.body);
    const orderId = req.params.id;
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase.from('purchase_orders').select('id').eq('tenant_id', tenantId).eq('id', orderId).maybeSingle();
    if (existingError) return res.status(502).json({ error: 'Failed to fetch purchase order', details: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    const resolvedSucursalId = body.sucursalId ?? scope?.sucursalId ?? null;
    if (scope?.mode === 'branch' && !resolvedSucursalId) {
      return res.status(400).json({ error: 'Sucursal activa requerida' });
    }
    if (resolvedSucursalId && !(await validateSucursalOwnership(supabase, tenantId, resolvedSucursalId))) {
      return res.status(404).json({ error: 'Sucursal not found' });
    }
    if (body.supplierId && !(await validateSupplierOwnership(supabase, tenantId, body.supplierId))) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const payload: Record<string, unknown> = {};
    if (body.sucursalId !== undefined) payload.sucursal_id = resolvedSucursalId;
    if (body.supplierId !== undefined) payload.supplier_id = body.supplierId;
    if (body.expectedDate !== undefined) payload.expected_date = body.expectedDate || null;
    if (body.notes !== undefined) payload.notes = body.notes || null;
    if (body.paymentTerms !== undefined) payload.payment_terms = body.paymentTerms || null;
    if (body.reference !== undefined) payload.reference = body.reference || null;

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) return res.status(502).json({ error: 'Failed to update purchase order', details: error.message });
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const orderId = req.params.id;
    const body = statusSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase.from('purchase_orders').select('id').eq('tenant_id', tenantId).eq('id', orderId).maybeSingle();
    if (existingError) return res.status(502).json({ error: 'Failed to fetch purchase order', details: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    const updatePayload: Record<string, unknown> = { status: body.status };
    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updatePayload)
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select('*')
      .single();

    if (error) return res.status(502).json({ error: 'Failed to update purchase order status', details: error.message });
    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating purchase order status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const orderId = req.params.id;
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase.from('purchase_orders').select('id').eq('tenant_id', tenantId).eq('id', orderId).maybeSingle();
    if (existingError) return res.status(502).json({ error: 'Failed to fetch purchase order', details: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    const { error } = await supabase
      .from('purchase_orders')
      .update({ status: 'cancelada' })
      .eq('tenant_id', tenantId)
      .eq('id', orderId);
    if (error) return res.status(502).json({ error: 'Failed to cancel purchase order', details: error.message });

    return res.json({ success: true, data: { id: orderId, status: 'cancelada' } });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const receivePurchaseOrder = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const orderId = req.params.id;
    const body = receiveSchema.parse(req.body);
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId).eq('id', orderId).single();
    if (orderError || !order) return res.status(404).json({ error: 'Purchase order not found', details: orderError?.message ?? 'Not found' });

    if (scope?.mode === 'branch' && scope.sucursalId && String(order.sucursal_id ?? '') !== scope.sucursalId) {
      return res.status(403).json({ error: 'Sucursal mismatch' });
    }

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('purchase_order_id', orderId)
      .order('created_at', { ascending: true });
    if (itemsError) return res.status(502).json({ error: 'Failed to fetch purchase order items', details: itemsError.message });

    const resolvedSucursalId = order.sucursal_id ?? scope?.sucursalId ?? null;
    const receivedPayload = buildReceivedItemsPayload(items ?? [], body.receivedItems);
    const changedBy = req.user?.userId ?? req.user?.sub ?? null;

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('receive_purchase_inventory', {
      p_tenant_id: tenantId,
      p_purchase_order_id: orderId,
      p_sucursal_id: resolvedSucursalId,
      p_received_items: receivedPayload,
      p_notes: body.notes || null,
      p_changed_by: changedBy,
    });

    if (rpcError) {
      return res.status(502).json({ error: 'Failed to receive purchase inventory', details: rpcError.message });
    }

    const payload = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;
    if (!payload) {
      return res.status(502).json({ error: 'Failed to receive purchase inventory', details: 'Empty RPC response' });
    }

    const inventoryRows = Array.isArray((payload as { inventory?: unknown }).inventory) ? ((payload as { inventory?: unknown }).inventory as Array<Record<string, unknown>>) : [];
    for (const inventoryRow of inventoryRows) {
      const productId = String(inventoryRow.product_id ?? '');
      const stockCurrent = Number(inventoryRow.stock_current ?? 0);
      if (productId) {
        await refreshInventoryAlert(tenantId, productId, String(inventoryRow.sucursal_id ?? resolvedSucursalId ?? ''), stockCurrent);
      }
    }

    return res.json({
      success: true,
      data: {
        order: {
          ...order,
          status: (payload as { status?: string }).status ?? order.status,
        },
        items: (payload as { updated_items?: unknown }).updated_items ?? [],
        movements: (payload as { movements?: unknown }).movements ?? [],
        inventory: (payload as { inventory?: unknown }).inventory ?? [],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error receiving purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
