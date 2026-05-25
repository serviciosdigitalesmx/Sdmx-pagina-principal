import { Request, Response } from 'express';
import { supabaseAdmin } from '@white-label/database';

export const getApiRoot = (_req: Request, res: Response) => {
  const apiName = process.env.API_NAME ?? 'White-label API';

  return res.status(200).json({
    name: apiName,
    status: 'ok',
    routes: {
      health: ['/health', '/healthz', '/api/health'],
      auth: ['/api/auth/me'],
    },
  });
};

export const getHealth = (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: process.env.API_NAME ?? 'White-label API',
  });
};

export const getCurrentUser = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      sub: req.user.sub ?? null,
      email: req.user.email ?? null,
      role: req.user.role,
      tenantId: req.user.tenantId,
      sucursalId: req.user.sucursalId ?? null,
    },
  });
};

export const resolveTenantForSupabaseUser = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.slice('Bearer '.length).trim();

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !data.user) {
      return res.status(401).json({ error: error?.message ?? 'Unable to validate session' });
    }

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role, branch_id')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    if (userRowError) {
      return res.status(502).json({ error: userRowError.message });
    }

    if (!userRow?.tenant_id) {
      return res.status(404).json({ error: 'Tenant not found for authenticated user' });
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, name')
      .eq('id', userRow.tenant_id)
      .maybeSingle();

    if (tenantError) {
      return res.status(502).json({ error: tenantError.message });
    }

    if (!tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    return res.status(200).json({
      user: {
        sub: data.user.id,
        email: data.user.email ?? null,
        tenantId: tenantRow.id,
        tenantSlug: tenantRow.slug,
        role: userRow.role,
        branchId: userRow.branch_id ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const getTenantSettings = async (req: Request, res: Response) => {
  const tenantSlug = req.params.tenantSlug;

  if (!tenantSlug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, name, branding, landing_content, operational_settings')
      .eq('slug', tenantSlug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Tenant not found', details: error?.message ?? 'Not found' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const updateTenantSettings = async (req: Request, res: Response) => {
  const tenantSlug = req.params.tenantSlug;

  if (!tenantSlug) {
    return res.status(400).json({ error: 'Tenant slug is required' });
  }

  try {
    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenantRow) {
      return res.status(404).json({ error: 'Tenant not found', details: tenantError?.message ?? 'Not found' });
    }

    const body = req.body as Record<string, unknown>;
    const branding = (body.branding && typeof body.branding === 'object') ? body.branding : null;
    const landingContent = (body.landingContent && typeof body.landingContent === 'object') ? body.landingContent : null;

    const operationalSettings = (body.operationalSettings && typeof body.operationalSettings === 'object') ? body.operationalSettings : null;
    const nextUpdate: Record<string, unknown> = {};

    if (branding) {
      nextUpdate.branding = branding;
    }

    if (landingContent) {
      nextUpdate.landing_content = landingContent;
    }

    if (operationalSettings) {
      nextUpdate.operational_settings = operationalSettings;
    }

    if (!Object.keys(nextUpdate).length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const { data, error } = await supabaseAdmin
      .from('tenants')
      .update(nextUpdate)
      .eq('id', tenantRow.id)
      .select('id, slug, name, branding, landing_content, operational_settings')
      .single();

    if (error || !data) {
      return res.status(502).json({ error: 'Failed to update tenant settings', details: error?.message ?? 'Unknown error' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
