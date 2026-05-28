import { Request, Response } from 'express';
import { z } from 'zod';
import { getTenantClient, supabaseAdmin } from '@white-label/database';

const createSucursalSchema = z.object({
  name: z.string().trim().min(2),
  code: z.string().trim().min(1).optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  city: z.string().trim().optional().or(z.literal('')),
  state: z.string().trim().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const updateSucursalSchema = createSucursalSchema.partial();

const assignUserSchema = z.object({
  userId: z.string().uuid(),
});

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function assertSucursalOwnership(tenantId: string, sucursalId: string) {
  const { data, error } = await supabaseAdmin
    .from('sucursales')
    .select('id, tenant_id')
    .eq('tenant_id', tenantId)
    .eq('id', sucursalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

async function countTenantSucursales(tenantId: string) {
  const { count, error } = await supabaseAdmin
    .from('sucursales')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export const listSucursales = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const supabase = getTenantClient(tenantId);
    const { data, error } = await supabase
      .from('sucursales')
      .select('id, tenant_id, name, code, address, city, state, phone, is_active, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch sucursales', details: error.message });
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error listing sucursales:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const createSucursal = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (req.user?.role !== 'owner' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const maxSucursales = req.tenantCapabilities?.limits.sucursales ?? null;
    if (typeof maxSucursales === 'number') {
      const currentSucursales = await countTenantSucursales(tenantId);

      if (currentSucursales >= maxSucursales) {
        return res.status(403).json({
          error: 'Sucursal limit reached for this plan',
          details: {
            currentSucursales,
            maxSucursales,
            planKey: req.tenantCapabilities?.plan_key ?? null,
          },
        });
      }
    }

    const body = createSucursalSchema.parse(req.body);
    const payload = {
      tenant_id: tenantId,
      name: body.name,
      code: body.code?.trim() || null,
      address: body.address?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      phone: body.phone?.trim() || null,
      is_active: body.isActive ?? true,
    };

    const { data, error } = await supabaseAdmin
      .from('sucursales')
      .insert([payload])
      .select('id, tenant_id, name, code, address, city, state, phone, is_active, created_at, updated_at')
      .single();

    if (error || !data) {
      return res.status(502).json({ error: 'Failed to create sucursal', details: error?.message ?? 'Unknown error' });
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error creating sucursal:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const updateSucursal = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const sucursalId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!isUuid(sucursalId)) {
      return res.status(400).json({ error: 'Invalid sucursal id' });
    }

    if (req.user?.role !== 'owner' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const ownsSucursal = await assertSucursalOwnership(tenantId, sucursalId);
    if (!ownsSucursal) {
      return res.status(404).json({ error: 'Sucursal not found' });
    }

    const body = updateSucursalSchema.parse(req.body);
    const nextData: Record<string, unknown> = {};

    if (body.name !== undefined) nextData.name = body.name;
    if (body.code !== undefined) nextData.code = body.code?.trim() || null;
    if (body.address !== undefined) nextData.address = body.address?.trim() || null;
    if (body.city !== undefined) nextData.city = body.city?.trim() || null;
    if (body.state !== undefined) nextData.state = body.state?.trim() || null;
    if (body.phone !== undefined) nextData.phone = body.phone?.trim() || null;
    if (body.isActive !== undefined) nextData.is_active = body.isActive;

    const { data, error } = await supabaseAdmin
      .from('sucursales')
      .update(nextData)
      .eq('tenant_id', tenantId)
      .eq('id', sucursalId)
      .select('id, tenant_id, name, code, address, city, state, phone, is_active, created_at, updated_at')
      .single();

    if (error || !data) {
      return res.status(502).json({ error: 'Failed to update sucursal', details: error?.message ?? 'Unknown error' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error updating sucursal:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const deleteSucursal = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const sucursalId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!isUuid(sucursalId)) {
      return res.status(400).json({ error: 'Invalid sucursal id' });
    }

    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: 'Only owner can delete sucursales' });
    }

    const ownsSucursal = await assertSucursalOwnership(tenantId, sucursalId);
    if (!ownsSucursal) {
      return res.status(404).json({ error: 'Sucursal not found' });
    }

    const { error } = await supabaseAdmin
      .from('sucursales')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', sucursalId);

    if (error) {
      return res.status(502).json({ error: 'Failed to delete sucursal', details: error.message });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting sucursal:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const assignUserToSucursal = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const sucursalId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    if (!isUuid(sucursalId)) {
      return res.status(400).json({ error: 'Invalid sucursal id' });
    }

    if (req.user?.role !== 'owner' && req.user?.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const ownsSucursal = await assertSucursalOwnership(tenantId, sucursalId);
    if (!ownsSucursal) {
      return res.status(404).json({ error: 'Sucursal not found' });
    }

    const body = assignUserSchema.parse(req.body);

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id')
      .eq('tenant_id', tenantId)
      .eq('id', body.userId)
      .maybeSingle();

    if (userRowError) {
      return res.status(502).json({ error: 'Failed to verify user', details: userRowError.message });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ sucursal_id: sucursalId })
      .eq('tenant_id', tenantId)
      .eq('id', body.userId)
      .select('id, tenant_id, sucursal_id, full_name, email, role, is_active')
      .single();

    if (error || !data) {
      return res.status(502).json({ error: 'Failed to assign user to sucursal', details: error?.message ?? 'Unknown error' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error assigning user to sucursal:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
