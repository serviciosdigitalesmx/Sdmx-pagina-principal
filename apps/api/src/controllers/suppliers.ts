import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient } from '@white-label/database';

const createSupplierSchema = z.object({
  businessName: z.string().min(1),
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
  priceScore: z.number().int().min(0).max(10).optional(),
  speedScore: z.number().int().min(0).max(10).optional(),
  qualityScore: z.number().int().min(0).max(10).optional(),
  reliabilityScore: z.number().int().min(0).max(10).optional(),
  notes: z.string().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

export const listSuppliers = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('suppliers')
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch suppliers', details: error.message });
    }

    return res.json({ success: true, data: data ?? [] });
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

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting supplier:', error);
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
    const body = createSupplierSchema.partial().parse(req.body);
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
    if (body.businessName !== undefined) payload.business_name = body.businessName;
    if (body.legalName !== undefined) payload.legal_name = body.legalName || null;
    if (body.contactName !== undefined) payload.contact_name = body.contactName || null;
    if (body.phone !== undefined) payload.phone = body.phone || null;
    if (body.whatsapp !== undefined) payload.whatsapp = body.whatsapp || null;
    if (body.email !== undefined) payload.email = body.email || null;
    if (body.address !== undefined) payload.address = body.address || null;
    if (body.city !== undefined) payload.city = body.city || null;
    if (body.state !== undefined) payload.state = body.state || null;
    if (body.categories !== undefined) payload.categories = body.categories || null;
    if (body.leadTimeDays !== undefined) payload.lead_time_days = body.leadTimeDays ?? null;
    if (body.paymentTerms !== undefined) payload.payment_terms = body.paymentTerms || null;
    if (body.priceScore !== undefined) payload.price_score = body.priceScore ?? 0;
    if (body.speedScore !== undefined) payload.speed_score = body.speedScore ?? 0;
    if (body.qualityScore !== undefined) payload.quality_score = body.qualityScore ?? 0;
    if (body.reliabilityScore !== undefined) payload.reliability_score = body.reliabilityScore ?? 0;
    if (body.notes !== undefined) payload.notes = body.notes || null;
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

    return res.json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating supplier:', error);
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

    return res.json({ success: true, data: { id: supplierId, is_active: false } });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createSupplier = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const body = createSupplierSchema.parse(req.body);
    const supabase = getTenantClient(tenantId);

    const { data, error } = await supabase
      .from('suppliers')
      .insert([
        {
          tenant_id: tenantId,
          business_name: body.businessName,
          legal_name: body.legalName || null,
          contact_name: body.contactName || null,
          phone: body.phone || null,
          whatsapp: body.whatsapp || null,
          email: body.email || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          categories: body.categories || null,
          lead_time_days: body.leadTimeDays ?? null,
          payment_terms: body.paymentTerms || null,
          price_score: body.priceScore ?? 0,
          speed_score: body.speedScore ?? 0,
          quality_score: body.qualityScore ?? 0,
          reliability_score: body.reliabilityScore ?? 0,
          notes: body.notes || null,
          is_active: body.isActive ?? true,
        },
      ])
      .select('id, tenant_id, business_name, legal_name, contact_name, phone, whatsapp, email, city, state, categories, lead_time_days, payment_terms, price_score, speed_score, quality_score, reliability_score, notes, is_active, created_at')
      .single();

    if (error) {
      return res.status(502).json({ error: 'Failed to create supplier', details: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating supplier:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getSecuritySummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    return res.json({
      success: true,
      data: {
        tenantId,
        userId: req.user?.sub ?? null,
        role: req.user?.role ?? null,
        email: req.user?.email ?? null,
        sucursalId: req.user?.sucursalId ?? null,
        canManageUsers: req.user?.role === 'owner',
        canManageRoles: req.user?.role === 'owner',
        canManageTenantSettings: req.user?.role === 'owner' || req.user?.role === 'manager',
      },
    });
  } catch (error) {
    console.error('Error getting security summary:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
