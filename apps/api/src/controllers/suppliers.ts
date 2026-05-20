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
