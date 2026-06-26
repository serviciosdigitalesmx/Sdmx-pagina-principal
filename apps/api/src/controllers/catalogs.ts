import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';
import { refreshInventoryAlert } from './stock-alerts';

const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
});

const updateCustomerSchema = createCustomerSchema.partial().refine((value) => Boolean(value.name || value.phone || value.email), {
  message: 'At least one field is required',
});

const customerConsentSchema = z.object({
  dataConsentStatus: z.enum(['pending', 'accepted', 'rejected', 'revoked']),
  dataConsentDate: z.union([z.string().datetime(), z.null(), z.literal('')]).optional(),
  dataConsentVersion: z.string().trim().optional().or(z.literal('')),
  dataConsentScope: z.array(z.string().trim().min(1)).optional().default(['privacy_notice', 'service_evidence']),
}).superRefine((value, ctx) => {
  if ((value.dataConsentStatus === 'accepted' || value.dataConsentStatus === 'revoked') && !value.dataConsentDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataConsentDate'],
      message: 'dataConsentDate is required for accepted or revoked consent',
    });
  }

  if (value.dataConsentStatus === 'accepted' && !value.dataConsentVersion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataConsentVersion'],
      message: 'dataConsentVersion is required for accepted consent',
    });
  }
});

type CustomerHistoryOrderRow = {
  id: string;
  folio: string;
  status: string | null;
  device_info: {
    type?: string | null;
    brand?: string | null;
    model?: string | null;
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
  } | null;
  problem_description: string | null;
  final_cost: number | null;
  estimated_cost: number | null;
  promised_date: string | null;
  created_at: string;
  updated_at: string;
  receipt_url: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown> | null;
};

type CustomerHistoryRequestRow = {
  id: string;
  folio: string;
  status: string | null;
  device_type: string | null;
  device_model: string | null;
  issue_description: string | null;
  quoted_total: number | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

function normalizeCustomerName(name?: string | null, fullName?: string | null) {
  return String(name ?? fullName ?? '').trim();
}

function serializeCustomerRow<T extends Record<string, unknown>>(row: T) {
  const displayName = normalizeCustomerName(row.name as string | null | undefined);
  return {
    ...row,
    name: displayName,
    full_name: displayName,
  };
}

function normalizeCustomerHistoryStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('conv')) return 'convertida';
  if (value.includes('rech')) return 'rechazada';
  if (value.includes('cot')) return 'cotizada';
  if (value.includes('diag')) return 'diagnostico';
  if (value.includes('repar')) return 'reparacion';
  if (value.includes('list')) return 'listo';
  if (value.includes('entreg')) return 'entregado';
  return 'pendiente';
}

async function findMatchingCustomer(
  supabase: ReturnType<typeof getTenantClient>,
  tenantId: string,
  name: string,
  phone: string,
) {
  if (phone) {
    const { data } = await supabase
      .from('customers')
      .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .maybeSingle();
    if (data) return data;
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    return null;
  }

  const { data: exactName } = await supabase
    .from('customers')
    .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
    .eq('tenant_id', tenantId)
    .ilike('name', normalizedName)
    .limit(1)
    .maybeSingle();

  if (exactName) return exactName;

  const { data: partialName } = await supabase
    .from('customers')
    .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
    .eq('tenant_id', tenantId)
    .ilike('name', `%${normalizedName}%`)
    .limit(1)
    .maybeSingle();

  return partialName ?? null;
}

const createInventorySchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  stock: z.coerce.number().nonnegative().optional(),
  stock_current: z.coerce.number().nonnegative().optional(),
  sucursalId: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!resolveInventoryDescription(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['description'], message: 'description or name is required' });
  }
  if (typeof value.stock !== 'number' && typeof value.stock_current !== 'number') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['stock'], message: 'stock or stock_current is required' });
  }
});

const updateInventorySchema = z.object({
  description: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  stock: z.coerce.number().nonnegative().optional(),
  stock_current: z.coerce.number().nonnegative().optional(),
  sucursalId: z.string().min(1).optional().nullable(),
  note: z.string().optional().or(z.literal('')),
});

const transferInventorySchema = z.object({
  sku: z.string().min(1),
  sucursalOrigen: z.string().uuid(),
  sucursalDestino: z.string().uuid(),
  cantidad: z.coerce.number().int().positive(),
  motivo: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
});

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveInventoryDescription(value: { description?: string | null; name?: string | null }) {
  return (value.description ?? value.name ?? '').trim();
}

function resolveInventoryStock(value: { stock?: number; stock_current?: number }, fallback = 0) {
  return Number(value.stock ?? value.stock_current ?? fallback);
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
    const normalized = (data ?? []).map((row) => serializeCustomerRow(row as Record<string, unknown>));
    return res.json({ success: true, data: normalized });
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
    const existingCustomer = await findMatchingCustomer(supabase, tenantId, body.name, body.phone);

    if (existingCustomer) {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: body.name || existingCustomer.name || '',
          phone: body.phone || existingCustomer.phone || '',
          email: body.email === undefined ? existingCustomer.email ?? null : body.email || null,
          sucursal_id: scope?.sucursalId ?? existingCustomer.sucursal_id ?? null,
        })
        .eq('tenant_id', tenantId)
        .eq('id', existingCustomer.id)
        .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
        .single();

      if (error) return res.status(502).json({ error: 'Failed to update customer', details: error.message });
      return res.status(200).json({
        success: true,
        data: serializeCustomerRow(data as Record<string, unknown>),
      });
    }

    const { data, error } = await supabase.from('customers').insert([{
      tenant_id: tenantId,
      sucursal_id: scope?.sucursalId ?? null,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
    }]).select('id, tenant_id, sucursal_id, name, phone, email, created_at').single();
    if (error) return res.status(502).json({ error: 'Failed to create customer', details: error.message });
    return res.status(201).json({
      success: true,
      data: serializeCustomerRow(data as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    const customerId = req.params.id;
    if (!customerId) return res.status(400).json({ error: 'Customer id is required' });

    const body = updateCustomerSchema.parse(req.body);
    const scope = req.scope;
    const supabase = getTenantClient(tenantId);
    const { data: existingCustomer, error: existingError } = await supabase
      .from('customers')
      .select('id, tenant_id, sucursal_id, name, phone, email')
      .eq('tenant_id', tenantId)
      .eq('id', customerId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to load customer', details: existingError.message });
    }

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const nextData = {
      name: body.name ?? existingCustomer.name ?? '',
      phone: body.phone ?? existingCustomer.phone ?? '',
      email: body.email === undefined ? existingCustomer.email ?? null : body.email || null,
      sucursal_id: scope?.mode === 'branch' && scope.sucursalId ? scope.sucursalId : existingCustomer.sucursal_id ?? null,
    };

    const { data, error } = await supabase
      .from('customers')
      .update(nextData)
      .eq('tenant_id', tenantId)
      .eq('id', customerId)
      .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
      .single();

    if (error) return res.status(502).json({ error: 'Failed to update customer', details: error.message });
    return res.json({
      success: true,
      data: serializeCustomerRow(data as Record<string, unknown>),
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error updating customer:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const updateCustomerConsent = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    const customerId = req.params.id;
    if (!customerId) return res.status(400).json({ error: 'Customer id is required' });

    const body = customerConsentSchema.parse(req.body);
    const consentDate = body.dataConsentDate === '' ? null : body.dataConsentDate ?? null;
    const supabase = getTenantClient(tenantId);

    const { data: existingCustomer, error: existingError } = await supabase
      .from('customers')
      .select('id, tenant_id, sucursal_id')
      .eq('tenant_id', tenantId)
      .eq('id', customerId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to load customer', details: existingError.message });
    }

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        data_consent_status: body.dataConsentStatus,
        data_consent_date: consentDate,
        data_consent_version: body.dataConsentVersion || null,
        data_consent_scope: body.dataConsentScope,
        data_consent_updated_by: req.user?.userId ?? null,
        data_consent_updated_at: new Date().toISOString(),
      })
      .eq('tenant_id', tenantId)
      .eq('id', customerId)
      .select('id, tenant_id, sucursal_id, name, phone, email, data_consent_status, data_consent_date, data_consent_version, data_consent_scope, data_consent_updated_by, data_consent_updated_at, created_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update customer consent', details: error.message });
    }

    return res.json({ success: true, data: serializeCustomerRow(data as Record<string, unknown>) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    console.error('Error updating customer consent:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};


export const getCustomerHistory = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const customerId = req.params.id;

    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });
    if (!customerId) return res.status(400).json({ error: 'Customer id is required' });

    const scope = req.scope;
    const supabase = getTenantClient(tenantId);

    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select('id, tenant_id, sucursal_id, name, phone, email, created_at')
      .eq('tenant_id', tenantId)
      .eq('id', customerId)
      .maybeSingle();

    if (customerError) {
      return res.status(502).json({ error: 'Failed to load customer', details: customerError.message });
    }

    if (!customerRow) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let ordersQuery = supabase
      .from('service_orders')
      .select('id, folio, status, device_info, problem_description, final_cost, estimated_cost, promised_date, created_at, updated_at, receipt_url, internal_notes, metadata')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (scope?.mode === 'branch' && scope.sucursalId) {
      ordersQuery = ordersQuery.eq('sucursal_id', scope.sucursalId);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;
    if (ordersError) {
      return res.status(502).json({ error: 'Failed to load customer orders', details: ordersError.message });
    }

    const { data: requestsData, error: requestsError } = await supabase
      .from('service_requests')
      .select('id, folio, status, device_type, device_model, issue_description, quoted_total, created_at, metadata')
      .eq('tenant_id', tenantId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (requestsError) {
      return res.status(502).json({ error: 'Failed to load customer quotations', details: requestsError.message });
    }

    const orders = (ordersData ?? []) as CustomerHistoryOrderRow[];
    const requests = (requestsData ?? []) as CustomerHistoryRequestRow[];
    const equipos = orders.map((order) => ({
      FOLIO: order.folio,
      TIPO: String(order.device_info?.type ?? ''),
      MODELO: String(order.device_info?.model ?? order.device_info?.brand ?? ''),
      FALLA: String(order.problem_description ?? ''),
      DIAGNOSTICO: String((order.metadata?.diagnosis ?? order.metadata?.diagnostico ?? order.internal_notes ?? '') || ''),
      ESTADO: String(order.status ?? 'recibido'),
      FECHA_INGRESO: order.created_at,
      FECHA_ENTREGA: order.status === 'entregado' ? order.updated_at : null,
      COSTO_ESTIMADO: Number(order.final_cost ?? order.estimated_cost ?? 0),
    }));

    const cotizaciones = requests.map((request) => ({
      folio: request.folio,
      dispositivo: String(request.device_type ?? ''),
      modelo: String(request.device_model ?? ''),
      descripcion: String(request.issue_description ?? ''),
      problemas: String(request.issue_description ?? ''),
      total: Number(request.quoted_total ?? 0),
      estado: normalizeCustomerHistoryStatus(request.status),
    }));

    const totalEquipos = equipos.length;
    const totalReparaciones = orders.filter((order) => {
      const normalized = normalizeCustomerHistoryStatus(order.status);
      return normalized !== 'pendiente' && normalized !== 'cotizada';
    }).length;
    const totalCotizaciones = cotizaciones.length;
    const combinedAmounts = [
      ...orders.map((order) => Number(order.final_cost ?? order.estimated_cost ?? 0)),
      ...requests.map((request) => Number(request.quoted_total ?? 0)),
    ].filter((value) => Number.isFinite(value) && value > 0);
    const ticketPromedio = combinedAmounts.length > 0
      ? combinedAmounts.reduce((sum, value) => sum + value, 0) / combinedAmounts.length
      : 0;
    const historyDates = [
      ...orders.map((order) => order.created_at),
      ...requests.map((request) => request.created_at),
    ].filter(Boolean).sort();

    return res.json({
      success: true,
      data: {
        customer: serializeCustomerRow(customerRow as Record<string, unknown>),
        totalEquipos,
        totalReparaciones,
        totalCotizaciones,
        ticketPromedio,
        ultimaVisita: historyDates.length > 0 ? historyDates[historyDates.length - 1] : null,
        equipos,
        cotizaciones,
      },
    });
  } catch (error) {
    console.error('Error getting customer history:', error);
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
        name: product?.name ?? null,
        description: product?.name ?? null,
        stock_current: Number((row as { stock_current?: number }).stock_current ?? 0),
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

    const resolvedDescription = resolveInventoryDescription(body);
    const resolvedStock = resolveInventoryStock(body);
    const productRow = await ensureProductCatalogRecord(supabase, tenantId, body.sku, resolvedDescription, resolvedDescription);
    const resolvedSucursalId = body.sucursalId ?? scope?.sucursalId ?? null;
    const changedBy = req.user?.userId ?? req.user?.sub ?? null;
    if (scope?.mode === 'branch' && !resolvedSucursalId) {
      return res.status(400).json({ error: 'Sucursal activa requerida' });
    }

    const inventoryRow = await persistInventoryStock(supabase, {
      tenantId,
      sucursalId: resolvedSucursalId,
      productId: productRow.id,
      stock: resolvedStock,
      reference: 'inventory_seed',
      notes: resolvedDescription,
      changedBy,
    });

    await refreshInventoryAlert(tenantId, productRow.id, resolvedSucursalId, Number((inventoryRow as { stock_current?: number }).stock_current ?? resolvedStock));
    return res.status(201).json({
      success: true,
      data: {
        ...inventoryRow,
        sku: body.sku,
        name: resolvedDescription,
        description: resolvedDescription,
        stock_current: Number((inventoryRow as { stock_current?: number }).stock_current ?? resolvedStock),
        stock: resolvedStock,
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

    const nextStock = resolveInventoryStock(body, Number(currentRow.stock_current ?? 0));
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

    const { data: updatedRow, error: updateError } = await supabase
      .from('sucursal_inventory')
      .update({
        stock_current: nextStock,
      })
      .eq('tenant_id', tenantId)
      .eq('id', inventoryId)
      .select('id, tenant_id, sucursal_id, product_id, stock_current, created_at, updated_at')
      .single();

    if (updateError || !updatedRow) {
      return res.status(502).json({ error: 'Failed to update inventory item', details: updateError?.message ?? 'Unable to persist inventory row' });
    }

    const movementErrorResult = await supabase
      .from('inventory_movements')
      .insert([{
        tenant_id: tenantId,
        sucursal_id: effectiveSucursalId,
        product_id: productRow.id,
        movement_type: 'adjustment',
        quantity: nextStock - Number(currentRow.stock_current ?? 0),
        unit_cost: 0,
        reference: body.note || 'stock_adjustment',
        notes: body.note || null,
        created_by: changedBy,
      }]);

    if (movementErrorResult.error) {
      return res.status(502).json({ error: 'Failed to update inventory item', details: movementErrorResult.error.message });
    }

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

export const transferInventoryItem = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ error: 'Tenant context is required' });

    if (req.user?.role !== 'owner' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const body = transferInventorySchema.parse(req.body);
    const supabase = getTenantClient(tenantId);
    const scope = req.scope;

    const { data: productRow, error: productError } = await supabase
      .from('products')
      .select('id, tenant_id, sku, name')
      .eq('tenant_id', tenantId)
      .eq('sku', body.sku)
      .maybeSingle();

    if (productError || !productRow) {
      return res.status(404).json({ error: 'Product not found', details: productError?.message ?? 'Not found' });
    }

    const [{ data: originProduct, error: originProductError }, { data: destinationProduct, error: destinationProductError }] = await Promise.all([
      supabase
        .from('sucursal_inventory')
        .select('id, tenant_id, sucursal_id, product_id, stock_current')
        .eq('tenant_id', tenantId)
        .eq('sucursal_id', body.sucursalOrigen)
        .eq('product_id', productRow.id)
        .maybeSingle(),
      supabase
        .from('sucursal_inventory')
        .select('id, tenant_id, sucursal_id, product_id, stock_current')
        .eq('tenant_id', tenantId)
        .eq('sucursal_id', body.sucursalDestino)
        .eq('product_id', productRow.id)
        .maybeSingle(),
    ]);

    if (originProductError) {
      return res.status(502).json({ error: 'Failed to load origin inventory', details: originProductError.message });
    }
    if (destinationProductError) {
      return res.status(502).json({ error: 'Failed to load destination inventory', details: destinationProductError.message });
    }

    if (!originProduct) {
      return res.status(404).json({ error: 'Origin inventory item not found' });
    }

    if (Number(originProduct.stock_current ?? 0) < body.cantidad) {
      return res.status(409).json({ error: 'Insufficient stock at origin' });
    }

    const originNextStock = Number(originProduct.stock_current ?? 0) - body.cantidad;
    const destinationBaseStock = Number(destinationProduct?.stock_current ?? 0);
    const destinationNextStock = destinationBaseStock + body.cantidad;
    const reference = body.motivo?.trim() || `transfer_${body.sku}`;
    const notes = body.notas?.trim() || null;
    const changedBy = req.user?.userId ?? req.user?.sub ?? null;

    const { error: originUpdateError } = await supabase
      .from('sucursal_inventory')
      .update({ stock_current: originNextStock })
      .eq('tenant_id', tenantId)
      .eq('id', originProduct.id);

    if (originUpdateError) {
      return res.status(502).json({ error: 'Failed to update origin stock', details: originUpdateError.message });
    }

    const { data: destinationRow, error: destinationUpsertError } = await supabase
      .from('sucursal_inventory')
      .upsert([{
        tenant_id: tenantId,
        sucursal_id: body.sucursalDestino,
        product_id: productRow.id,
        stock_current: destinationNextStock,
      }], { onConflict: 'tenant_id,sucursal_id,product_id' })
      .select('id, tenant_id, sucursal_id, product_id, stock_current, created_at, updated_at')
      .single();

    if (destinationUpsertError || !destinationRow) {
      return res.status(502).json({ error: 'Failed to update destination stock', details: destinationUpsertError?.message ?? 'Unable to persist transfer' });
    }

    const movementRows = [
      {
        tenant_id: tenantId,
        sucursal_id: body.sucursalOrigen,
        product_id: productRow.id,
        movement_type: 'transfer_out',
        quantity: -body.cantidad,
        unit_cost: 0,
        reference,
        notes,
        created_by: changedBy,
      },
      {
        tenant_id: tenantId,
        sucursal_id: body.sucursalDestino,
        product_id: productRow.id,
        movement_type: 'transfer_in',
        quantity: body.cantidad,
        unit_cost: 0,
        reference,
        notes,
        created_by: changedBy,
      },
    ];

    const { error: movementError } = await supabase.from('inventory_movements').insert(movementRows);
    if (movementError) {
      return res.status(502).json({ error: 'Failed to persist transfer movements', details: movementError.message });
    }

    await refreshInventoryAlert(tenantId, productRow.id, body.sucursalOrigen, originNextStock);
    await refreshInventoryAlert(tenantId, productRow.id, body.sucursalDestino, destinationNextStock);

    return res.status(201).json({
      success: true,
      data: {
        product: productRow,
        origin: originProduct,
        destination: destinationRow,
        moved: body.cantidad,
        reference,
        notes,
        scope: scope?.mode ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error transferring inventory item:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
