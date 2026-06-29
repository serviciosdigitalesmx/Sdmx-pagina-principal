import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';
import { resolveDisplayUserRole, resolveEffectiveUserRole, normalizeStoredUserRole } from '../lib/user-roles';
import { getRequestIp } from '../lib/request-ip';
import { writeAuditLog } from '../services/security-backoffice';
import { assertTenantPlanLimit, PlanLimitExceededError } from '../services/tenant-plan-limits';

const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().optional(),
  role: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
});

const inviteUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2),
  role: z.string().trim().min(1),
  sucursalId: z.preprocess(
    (value) => typeof value === 'string' && !value.trim() ? undefined : value,
    z.string().uuid().nullable().optional(),
  ),
  password: z.string().min(8).optional(),
});

const updateRoleSchema = z.object({
  role: z.string().trim().min(1),
});

function getTenantId(req: Request) {
  return req.user?.tenantId ?? null;
}

function getRequesterRole(req: Request) {
  return req.user?.role ?? null;
}

function canManageUsers(req: Request) {
  return req.user?.role === 'owner' || req.user?.role === 'manager';
}

function ensureAllowedStoredRole(role: string) {
  const normalized = normalizeStoredUserRole(role);
  if (!normalized) {
    throw new Error('Invalid role');
  }
  return normalized;
}

function generateTemporaryPassword() {
  return `Fixi-${randomBytes(10).toString('hex')}!`;
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

async function resolveTenantSlug(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, slug')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

function mapUserRow(row: Record<string, unknown>) {
  const role = String(row.role ?? '');
  return {
    id: String(row.id ?? ''),
    tenantId: String(row.tenant_id ?? ''),
    authUserId: row.auth_user_id ? String(row.auth_user_id) : null,
    name: String(row.name ?? row.full_name ?? ''),
    fullName: String(row.full_name ?? row.name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone ? String(row.phone) : null,
    role,
    displayRole: resolveDisplayUserRole(role),
    effectiveRole: resolveEffectiveUserRole(role),
    activo: Boolean(row.activo ?? row.is_active ?? true),
    is_active: Boolean(row.is_active ?? row.activo ?? true),
    ultimo_acceso: row.ultimo_acceso ?? row.last_login_at ?? null,
    last_login_at: row.last_login_at ?? row.ultimo_acceso ?? null,
    sucursalId: row.sucursal_id ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export const listUsers = async (req: Request, res: Response) => {
  try {
    if (!canManageUsers(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const parsed = userListQuerySchema.safeParse({
      page: req.query.page,
      pageSize: req.query.pageSize,
      q: req.query.q,
      role: req.query.role,
      status: req.query.status ?? 'all',
    });

    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query parameters', details: parsed.error.flatten() });
    }

    const { page, pageSize, q, role, status } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from('users')
      .select('id, tenant_id, auth_user_id, name, full_name, email, phone, role, activo, is_active, ultimo_acceso, last_login_at, sucursal_id, created_at, updated_at', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (q) {
      const normalized = q.trim();
      query = query.or(`name.ilike.%${normalized}%,full_name.ilike.%${normalized}%,email.ilike.%${normalized}%`);
    }

    if (role) {
      query = query.eq('role', ensureAllowedStoredRole(role));
    }

    if (status === 'active') {
      query = query.eq('activo', true);
    } else if (status === 'inactive') {
      query = query.eq('activo', false);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch users', details: error.message });
    }

    return res.json({
      success: true,
      data: {
        items: (data ?? []).map(mapUserRow),
        page,
        pageSize,
        total: count ?? 0,
        hasMore: page * pageSize < (count ?? 0),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const inviteUser = async (req: Request, res: Response) => {
  try {
    if (!canManageUsers(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const parsed = inviteUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const body = parsed.data;
    const role = ensureAllowedStoredRole(body.role);

    await assertTenantPlanLimit({
      tenantId,
      resource: 'users',
      increment: 1,
      requestId: req.requestId ?? null,
    });

    if (body.sucursalId) {
      const ownsSucursal = await assertSucursalOwnership(tenantId, body.sucursalId);
      if (!ownsSucursal) {
        return res.status(404).json({ error: 'Sucursal not found' });
      }
    }

    const tenantRow = await resolveTenantSlug(tenantId);
    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const authMetadata = {
      tenant_id: tenantId,
      tenant_slug: tenantRow.slug,
      role,
      sucursal_id: body.sucursalId ?? undefined,
      name: body.name,
    };

    let authResponse = body.password
      ? await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: authMetadata,
        })
      : await supabaseAdmin.auth.admin.inviteUserByEmail(body.email, {
          data: authMetadata,
        });

    let temporaryPassword: string | null = null;

    if (!body.password && authResponse.error) {
      temporaryPassword = generateTemporaryPassword();
      authResponse = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: authMetadata,
      });
    }

    const authUser = authResponse.data.user ?? null;
    const authError = authResponse.error;

    if (authError || !authUser) {
      return res.status(502).json({
        error: body.password ? 'Failed to create user credentials' : 'Failed to invite user',
        details: authError?.message ?? 'Unknown error',
      });
    }

    if (body.password) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        email_confirm: true,
      });

      if (confirmError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch((rollbackError) => {
          console.error('Failed to rollback unconfirmed auth user:', rollbackError);
        });
        return res.status(502).json({ error: 'Failed to confirm user credentials', details: confirmError.message });
      }
    }

    const { data: existingUser, error: existingError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (existingError) {
      return res.status(502).json({ error: 'Failed to verify user record', details: existingError.message });
    }

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          name: body.name,
          full_name: body.name,
          email: body.email,
          role,
          activo: true,
          is_active: true,
          sucursal_id: body.sucursalId ?? null,
                  })
        .eq('id', existingUser.id)
        .select('id, tenant_id, auth_user_id, name, full_name, email, phone, role, activo, is_active, ultimo_acceso, last_login_at, sucursal_id, created_at, updated_at')
        .maybeSingle();

      if (updateError || !updatedUser) {
        return res.status(502).json({ error: 'Failed to update existing user', details: updateError?.message ?? 'Unknown error' });
      }

      return res.status(200).json({
        success: true,
        data: {
          user: mapUserRow(updatedUser),
          invite: {
            id: authUser.id,
            email: body.email,
            role,
            sucursalId: body.sucursalId ?? null,
            tenantId,
            requesterRole: getRequesterRole(req),
          },
          temporaryPassword,
        },
      });
    }

    const { data: createdUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert([{
        tenant_id: tenantId,
        auth_user_id: authUser.id,
        name: body.name,
        full_name: body.name,
        email: body.email,
        role,
        activo: true,
        is_active: true,
        sucursal_id: body.sucursalId ?? null,
              }])
      .select('id, tenant_id, auth_user_id, name, full_name, email, phone, role, activo, is_active, ultimo_acceso, last_login_at, sucursal_id, created_at, updated_at')
      .single();

    if (createError || !createdUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id).catch((rollbackError) => {
        console.error('Failed to rollback invited auth user:', rollbackError);
      });

      return res.status(502).json({ error: 'Failed to persist invited user', details: createError?.message ?? 'Unknown error' });
    }

    return res.status(201).json({
      success: true,
      data: {
        user: mapUserRow(createdUser),
        invite: {
          id: authUser.id,
          email: body.email,
          role,
          sucursalId: body.sucursalId ?? null,
          tenantId,
          requesterRole: getRequesterRole(req),
        },
        temporaryPassword,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid payload', details: error.errors });
    }
    if (error instanceof PlanLimitExceededError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        resource: error.resource,
        limit: error.limit,
        used: error.used,
        requested: error.requested,
        requestId: error.requestId ?? req.requestId ?? null,
      });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    if (!canManageUsers(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const userId = String(req.params.id ?? '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }

    const role = ensureAllowedStoredRole(parsed.data.role);

    const { data: currentUser, error: currentUserError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, auth_user_id, role, activo, is_active')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (currentUserError) {
      return res.status(502).json({ error: 'Failed to load user', details: currentUserError.message });
    }

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role,
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, auth_user_id, name, full_name, email, phone, role, activo, is_active, ultimo_acceso, last_login_at, sucursal_id, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      return res.status(502).json({ error: 'Failed to update user role', details: updateError?.message ?? 'Unknown error' });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: 'users.role.updated',
      ipAddress: getRequestIp(req.headers, req.ip),
      userAgent: req.headers['user-agent'] ?? null,
      dataBefore: currentUser,
      dataAfter: updatedUser,
    });

    return res.status(200).json({
      success: true,
      data: mapUserRow(updatedUser),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    if (!canManageUsers(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const userId = String(req.params.id ?? '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        activo: false,
        is_active: false,
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id, tenant_id, auth_user_id, name, full_name, email, phone, role, activo, is_active, ultimo_acceso, last_login_at, sucursal_id, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      return res.status(502).json({ error: 'Failed to deactivate user', details: updateError?.message ?? 'Unknown error' });
    }

    await writeAuditLog({
      tenantId,
      userId: req.user?.userId ?? null,
      action: 'users.deactivated',
      ipAddress: getRequestIp(req.headers, req.ip),
      userAgent: req.headers['user-agent'] ?? null,
      dataAfter: updatedUser,
    });

    return res.status(200).json({
      success: true,
      data: mapUserRow(updatedUser),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getUserPurchaseOrders = async (req: Request, res: Response) => {
  try {
    if (!canManageUsers(req)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const tenantId = getTenantId(req);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context is required' });
    }

    const userId = String(req.params.id ?? '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'User id is required' });
    }

    const { data: userRow, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, auth_user_id, name, full_name, email, role, activo')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (userError) {
      return res.status(502).json({ error: 'Failed to load user', details: userError.message });
    }

    if (!userRow) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, tenant_id, sucursal_id, supplier_id, related_service_order_id, folio, status, reference, payment_terms, expected_date, subtotal, tax_amount, total, notes, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .eq('created_by', userRow.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(502).json({ error: 'Failed to fetch purchase history', details: error.message });
    }

    return res.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
