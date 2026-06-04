import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';
import { writeAuditLog } from '../services/security-backoffice';

const supplierStatusSchema = z.enum(['active', 'inactive']);

const supplierFiltersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).optional(),
});

const supplierPayloadSchema = z.object({
  businessName: z.string().min(1),
  rfc: z.string().optional().or(z.literal('')),
  legalName: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  categories: z.string().optional().or(z.literal('')),
  leadTimeDays: z.number().int().nonnegative().optional(),
  paymentTerms: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const supplierStatusPayloadSchema = z.object({
  status: supplierStatusSchema,
});

function toSupplierResponse(row: Record<string, unknown>) {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    business_name: row.business_name,
    nombre: row.business_name,
    rfc: row.rfc ?? null,
    legal_name: row.legal_name ?? null,
    contact_name: row.contact_name ?? null,
    telefono: row.phone ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    direccion: row.address ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    state: row.state ?? null,
    categories: row.categories ?? null,
    lead_time_days: row.lead_time_days ?? null,
    payment_terms: row.payment_terms ?? null,
    condiciones_pago: row.payment_terms ?? null,
    price_score: row.price_score ?? null,
    speed_score: row.speed_score ?? null,
    quality_score: row.quality_score ?? null,
    reliability_score: row.reliability_score ?? null,
    notes: row.notes ?? null,
    is_active: row.is_active ?? false,
    estatus: row.is_active ? 'active' : 'inactive',
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function normalizeSearch(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function buildSupplierQuery(supabase: ReturnType<typeof getTenantClient>, tenantId: string, filters: z.infer<typeof supplierFiltersSchema>) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;
  const search = normalizeSearch(filters.q);
  const name = normalizeSearch(filters.name);

  let query = supabase
    .from('suppliers')
    .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, address, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at, updated_at', { count: 'exact' })
    .eq('tenant_id', tenantId);

  if (search) {
    query = query.or(`business_name.ilike.%${search}%`);
  }

  if (name) {
    query = query.ilike('business_name', `%${name}%`);
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true);
  }

  if (filters.status === 'inactive') {
    query = query.eq('is_active', false);
  }

  return query.order('business_name', { ascending: true }).range(offset, offset + pageSize - 1);
}

export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const parsed = supplierFiltersSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query params', details: parsed.error.flatten() });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error, count } = await buildSupplierQuery(supabase, tenantId, parsed.data);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch suppliers', details: error.message });
    }

    const page = parsed.data.page ?? 1;
    const pageSize = parsed.data.pageSize ?? 20;
    const total = count ?? 0;

    return res.json({
      success: true,
      data: (data ?? []).map(toSupplierResponse),
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (error) {
    console.error('Error listing suppliers:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSupplierById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supplierId = req.params.id;
    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, address, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .maybeSingle();

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch supplier', details: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.json({ success: true, data: toSupplierResponse(data) });
  } catch (error) {
    console.error('Error getting supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = supplierPayloadSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          tenant_id: tenantId,
          business_name: body.businessName.trim(),
          legal_name: body.legalName?.trim() || null,
          contact_name: body.contactName?.trim() || null,
          phone: body.phone?.trim() || null,
          whatsapp: body.whatsapp?.trim() || null,
          email: body.email?.trim() || null,
          address: body.address?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          categories: body.categories?.trim() || null,
          lead_time_days: body.leadTimeDays ?? null,
          payment_terms: body.paymentTerms?.trim() || null,
          price_score: 1,
          speed_score: 1,
          quality_score: 1,
          reliability_score: 1,
          notes: body.notes?.trim() || null,
          is_active: body.isActive ?? true,
        },
      ])
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, address, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at, updated_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to create supplier', details: error.message });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: 'suppliers.created',
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      dataAfter: data,
    }).catch((auditError) => {
      console.error('Failed to write supplier create audit log:', auditError);
    });

    return res.status(201).json({ success: true, data: toSupplierResponse(data) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.flatten() });
    }
    console.error('Error creating supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supplierId = req.params.id;
    const body = supplierPayloadSchema.partial().parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to fetch supplier', details: existingError.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const payload: Record<string, unknown> = {};
    if (body.businessName !== undefined) payload.business_name = body.businessName.trim();
    if (body.legalName !== undefined) payload.legal_name = body.legalName?.trim() || null;
    if (body.contactName !== undefined) payload.contact_name = body.contactName?.trim() || null;
    if (body.phone !== undefined) payload.phone = body.phone?.trim() || null;
    if (body.whatsapp !== undefined) payload.whatsapp = body.whatsapp?.trim() || null;
    if (body.email !== undefined) payload.email = body.email?.trim() || null;
    if (body.address !== undefined) payload.address = body.address?.trim() || null;
    if (body.city !== undefined) payload.city = body.city?.trim() || null;
    if (body.state !== undefined) payload.state = body.state?.trim() || null;
    if (body.categories !== undefined) payload.categories = body.categories?.trim() || null;
    if (body.leadTimeDays !== undefined) payload.lead_time_days = body.leadTimeDays ?? null;
    if (body.paymentTerms !== undefined) payload.payment_terms = body.paymentTerms?.trim() || null;
    if (body.notes !== undefined) payload.notes = body.notes?.trim() || null;
    if (body.isActive !== undefined) payload.is_active = body.isActive;

    const { data, error } = await supabase
      .from('suppliers')
      .update(payload)
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, address, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at, updated_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update supplier', details: error.message });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: 'suppliers.updated',
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      dataBefore: existing,
      dataAfter: data,
    }).catch((auditError) => {
      console.error('Failed to write supplier update audit log:', auditError);
    });

    return res.json({ success: true, data: toSupplierResponse(data) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.flatten() });
    }
    console.error('Error updating supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateSupplierStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supplierId = req.params.id;
    const body = supplierStatusPayloadSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to fetch supplier', details: existingError.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { data, error } = await supabase
      .from('suppliers')
      .update({ is_active: body.status === 'active' })
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, address, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at, updated_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to update supplier status', details: error.message });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: body.status === 'active' ? 'suppliers.activated' : 'suppliers.deactivated',
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      dataBefore: existing,
      dataAfter: data,
    }).catch((auditError) => {
      console.error('Failed to write supplier status audit log:', auditError);
    });

    return res.json({ success: true, data: toSupplierResponse(data) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.flatten() });
    }
    console.error('Error updating supplier status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const listSupplierPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supplierId = req.params.id;
    const supabase = getTenantClient(tenantId);

    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .maybeSingle();

    if (supplierError) {
      return res.status(502).json({ error: 'Failed to fetch supplier', details: supplierError.message });
    }

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('id, tenant_id, sucursal_id, supplier_id, related_service_order_id, folio, status, reference, payment_terms, expected_date, subtotal, tax_amount, total, notes, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch purchase orders', details: error.message });
    }

    return res.json({ success: true, data: data ?? [] });
  } catch (error) {
    console.error('Error listing supplier purchase orders:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteSupplier = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supplierId = req.params.id;
    const supabase = getTenantClient(tenantId);

    const { data: existing, error: existingError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('id', supplierId)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to fetch supplier', details: existingError.message });
    }

    if (!existing) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { error } = await supabase
      .from('suppliers')
      .update({ is_active: false })
      .eq('tenant_id', tenantId)
      .eq('id', supplierId);

    if (error) {
      return res.status(502).json({ error: 'Failed to deactivate supplier', details: error.message });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: 'suppliers.deactivated',
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      dataBefore: existing,
    }).catch((auditError) => {
      console.error('Failed to write supplier delete audit log:', auditError);
    });

    return res.json({ success: true, data: { id: supplierId, is_active: false, estatus: 'inactive' } });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
