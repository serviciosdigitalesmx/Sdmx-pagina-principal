import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'manager', 'technician']).default('technician'),
  sucursalId: z.string().uuid().nullable().optional(),
});

async function countTenantUsers(tenantId: string) {
  const { count, error } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function assertSucursalOwnership(tenantId: string, sucursalId: string) {
  const { data, error } = await supabaseAdmin
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

export const getSecuritySummary = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const [usersResult, sucursalesResult] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      supabaseAdmin.from('sucursales').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]);

    if (usersResult.error) {
      return res.status(502).json({ error: 'Failed to fetch users summary', details: usersResult.error.message });
    }

    if (sucursalesResult.error) {
      return res.status(502).json({ error: 'Failed to fetch sucursales summary', details: sucursalesResult.error.message });
    }

    return res.json({
      success: true,
      data: {
        users: usersResult.count ?? 0,
        sucursales: sucursalesResult.count ?? 0,
      },
    });
  } catch (error) {
    console.error('Error getting security summary:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const inviteUser = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const tenantCapabilities = req.tenantCapabilities;
    const maxUsers = tenantCapabilities?.limits.users ?? null;
    if (typeof maxUsers === 'number') {
      const currentUsers = await countTenantUsers(tenantId);
      if (currentUsers >= maxUsers) {
        return res.status(403).json({
          error: 'User limit reached for this plan',
          details: {
            currentUsers,
            maxUsers,
            planKey: tenantCapabilities?.plan_key ?? null,
          },
        });
      }
    }

    const body = inviteUserSchema.parse(req.body);

    if (body.sucursalId) {
      const ownsSucursal = await assertSucursalOwnership(tenantId, body.sucursalId);
      if (!ownsSucursal) {
        return res.status(404).json({ error: 'Sucursal not found' });
      }
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug')
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantError) {
      return res.status(502).json({ error: 'Failed to resolve tenant', details: tenantError.message });
    }

    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { data: inviteResult, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
      data: {
        tenant_id: tenantId,
        tenant_slug: tenantRow.slug,
        role: body.role,
        sucursal_id: body.sucursalId ?? undefined,
      },
    });

    if (inviteError || !inviteResult.user) {
      return res.status(502).json({ error: 'Failed to invite user', details: inviteError?.message ?? 'Unknown error' });
    }

    const { data: createdUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        tenant_id: tenantId,
        auth_user_id: inviteResult.user.id,
        full_name: inviteResult.user.user_metadata?.full_name ?? null,
        email: body.email,
        role: body.role,
        is_active: true,
        sucursal_id: body.sucursalId ?? null,
      }])
      .select('id, tenant_id, auth_user_id, full_name, email, role, is_active, sucursal_id, created_at')
      .single();

    if (createError || !createdUser) {
      await supabaseAdmin.auth.admin.deleteUser(inviteResult.user.id).catch((rollbackError) => {
        console.error('Failed to rollback invited auth user:', rollbackError);
      });

      return res.status(502).json({ error: 'Failed to persist invited user', details: createError?.message ?? 'Unknown error' });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: createdUser,
        invite: {
          id: inviteResult.user.id,
          email: body.email,
          role: body.role,
          sucursalId: body.sucursalId ?? null,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    console.error('Error inviting user:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
