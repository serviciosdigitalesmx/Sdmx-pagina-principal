import { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getTenantClient } from '@white-label/database';

const purchaseOrderStatusSchema = z.enum(['borrador', 'enviada', 'parcial', 'recibida', 'cancelada']);

const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal('')),
  skuSnapshot: z.string().min(1).optional().or(z.literal('')),
  productNameSnapshot: z.string().min(1).optional().or(z.literal('')),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().nonnegative(),
});

const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  branchId: z.string().uuid().optional().or(z.literal('')),
  expectedDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  paymentTerms: z.string().optional().or(z.literal('')),
  reference: z.string().optional().or(z.literal('')),
  items: z.array(purchaseOrderItemSchema).min(1),
});

const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional().or(z.literal('')).nullable(),
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
    skuSnapshot: z.string().min(1).optional().or(z.literal('')),
    quantity: z.coerce.number().positive(),
  })).optional(),
});

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function validateBranchOwnership(supabase: ReturnType<typeof getTenantClient>, tenantId: string, branchId?: string | null) {
  if (!branchId) {
    return true;
  }
  const { data, error } = await supabase
    .from('branches')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('id', branchId)
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
    supabase.from('inventory_movements').select('id, tenant_id, branch_id, product_id, purchase_order_id, movement_type, quantity, unit_cost, reference, notes, created_by, created_at').eq('tenant_id', tenantId).eq('purchase_order_id', orderId).order('created_at', { ascending: true }),
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
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('id, tenant_id, branch_id, supplier_id, related_service_order_id, folio, status, reference, payment_terms, expected_date, subtotal, tax_amount, total, notes, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

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
    const orderId = req.params.id;
    const { order, items, documents } = await getPurchaseOrderDetail(supabase, tenantId, orderId);

    if (order.error) return res.status(502).json({ error: 'Failed to fetch purchase order', details: order.error.message });
    if (!order.data) return res.status(404).json({ error: 'Purchase order not found' });
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
    const supabase = getTenantClient(tenantId);

    if (!(await validateSupplierOwnership(supabase, tenantId, body.supplierId))) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    if (!(await validateBranchOwnership(supabase, tenantId, body.branchId || null))) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    const folio = `OC-${Date.now().toString(36).toUpperCase()}`;
    const subtotal = body.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
    const taxAmount = 0;
    const total = Number((subtotal + taxAmount).toFixed(2));

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert([{
        tenant_id: tenantId,
        branch_id: body.branchId || null,
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
        created_by: req.user?.sub ?? null,
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
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase.from('purchase_orders').select('id').eq('tenant_id', tenantId).eq('id', orderId).maybeSingle();
    if (existingError) return res.status(502).json({ error: 'Failed to fetch purchase order', details: existingError.message });
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    if (body.branchId && !(await validateBranchOwnership(supabase, tenantId, body.branchId))) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    if (body.supplierId && !(await validateSupplierOwnership(supabase, tenantId, body.supplierId))) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const payload: Record<string, unknown> = {};
    if (body.branchId !== undefined) payload.branch_id = body.branchId || null;
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
    const supabase = getTenantClient(tenantId);

    const { data: order, error: orderError } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId).eq('id', orderId).single();
    if (orderError || !order) return res.status(404).json({ error: 'Purchase order not found', details: orderError?.message ?? 'Not found' });

    const { data: items, error: itemsError } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('purchase_order_id', orderId)
      .order('created_at', { ascending: true });
    if (itemsError) return res.status(502).json({ error: 'Failed to fetch purchase order items', details: itemsError.message });

    const receivedBySku = new Map<string, number>();
    for (const receivedItem of body.receivedItems ?? []) {
      const key = receivedItem.skuSnapshot?.trim();
      if (!key) continue;
      receivedBySku.set(key, Number(receivedItem.quantity));
    }

    const inventorySnapshots: Array<Record<string, unknown>> = [];
    const movementRows: Array<Record<string, unknown>> = [];

    for (const item of items ?? []) {
      const sku = String(item.sku_snapshot ?? '');
      const receivedQuantity = receivedBySku.get(sku) ?? Number(item.qty_ordered ?? 0);
      if (!receivedQuantity || receivedQuantity <= 0) continue;

      const productCatalog = await ensureProductCatalogRecord(
        supabase,
        tenantId,
        sku,
        String(item.product_name_snapshot ?? sku),
        String(item.product_name_snapshot ?? sku),
      );

      const { data: inventoryRow, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('sku', sku)
        .maybeSingle();
      if (inventoryError) return res.status(502).json({ error: 'Failed to fetch inventory row', details: inventoryError.message });

      let nextInventory = inventoryRow;
      if (!nextInventory) {
        const { data: createdInventory, error: createInventoryError } = await supabase
          .from('inventory')
          .insert([{
            id: productCatalog.id,
            tenant_id: tenantId,
            branch_id: order.branch_id ?? null,
            sku,
            description: String(item.product_name_snapshot ?? sku),
            stock: 0,
          }])
          .select('*')
          .single();
        if (createInventoryError || !createdInventory) return res.status(502).json({ error: 'Failed to create inventory item on receipt', details: createInventoryError?.message ?? 'Unknown error' });
        nextInventory = createdInventory;
      }

      const nextStock = Number(nextInventory.stock ?? 0) + receivedQuantity;
      const { error: updateInventoryError } = await supabase
        .from('inventory')
        .update({
          stock: nextStock,
          branch_id: order.branch_id ?? nextInventory.branch_id ?? null,
        })
        .eq('tenant_id', tenantId)
        .eq('id', nextInventory.id);
      if (updateInventoryError) return res.status(502).json({ error: 'Failed to update inventory stock', details: updateInventoryError.message });

      inventorySnapshots.push({ id: nextInventory.id, sku, stock: nextStock });
      movementRows.push({
        tenant_id: tenantId,
        branch_id: order.branch_id ?? null,
        product_id: productCatalog.id,
        purchase_order_id: orderId,
        movement_type: 'purchase_received',
        quantity: receivedQuantity,
        unit_cost: Number(item.unit_cost ?? 0),
        reference: String(order.folio),
        notes: body.notes || null,
        created_by: req.user?.sub ?? null,
      });

      const { error: updateItemError } = await supabase
        .from('purchase_order_items')
        .update({
          qty_received: receivedQuantity,
          subtotal: Number((Number(item.qty_ordered ?? 0) * Number(item.unit_cost ?? 0)).toFixed(2)),
        })
        .eq('tenant_id', tenantId)
        .eq('id', item.id);
      if (updateItemError) return res.status(502).json({ error: 'Failed to update purchase order item', details: updateItemError.message });
    }

    if (movementRows.length > 0) {
      const { error: movementError } = await supabase.from('inventory_movements').insert(movementRows);
      if (movementError) return res.status(502).json({ error: 'Failed to persist inventory movements', details: movementError.message });
    }

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'recibida',
      })
      .eq('tenant_id', tenantId)
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateOrderError) return res.status(502).json({ error: 'Failed to finalize purchase order', details: updateOrderError.message });

    return res.json({ success: true, data: { order: updatedOrder, inventory: inventorySnapshots, movements: movementRows } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error receiving purchase order:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
