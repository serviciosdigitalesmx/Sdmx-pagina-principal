import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';

const registerSchema = z.object({
  workshopName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().min(7),
});

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64url');
}

function getAllowedAppOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const appUrl = process.env.APP_URL?.trim();

  return new Set([
    ...configuredOrigins,
    ...(appUrl ? [appUrl] : []),
  ]);
}

function isAllowedRedirectUrl(candidate: string) {
  try {
    const parsed = new URL(candidate);
    return parsed.hostname.endsWith('.vercel.app') || getAllowedAppOrigins().has(parsed.origin);
  } catch {
    return false;
  }
}

function resolveAppUrl(requestOrigin: string | undefined) {
  if (requestOrigin && isAllowedRedirectUrl(requestOrigin)) {
    return requestOrigin;
  }

  const configuredAppUrl = process.env.APP_URL?.trim();

  if (configuredAppUrl && isAllowedRedirectUrl(configuredAppUrl)) {
    return configuredAppUrl;
  }

  const fallbackOrigin = Array.from(getAllowedAppOrigins()).find((origin) => isAllowedRedirectUrl(origin));

  return fallbackOrigin ?? null;
}

function signJwt(payload: Record<string, unknown>) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
}

function buildAuthPayload(user: { id: string; email?: string | null }, tenant: { id: string; slug?: string | null }, role: string, branchId?: string | null) {
  return {
    token: signJwt({
      sub: user.id,
      email: user.email ?? undefined,
      role,
      tenant_id: tenant.id,
      tenant_slug: tenant.slug ?? undefined,
      sucursal_id: branchId ?? undefined,
    }),
    user: {
      sub: user.id,
      email: user.email ?? null,
      role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug ?? null,
      branchId: branchId ?? null,
    },
  };
}

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { workshopName, email, password, phone } = parsed.data;
  const appUrl = resolveAppUrl(typeof req.headers.origin === 'string' ? req.headers.origin : undefined);

  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL is required' });
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    phone,
    email_confirm: true,
    user_metadata: {
      role: 'owner',
      workshop_name: workshopName,
    },
  });

  if (authError || !authUser.user) {
    return res.status(409).json({
      error: authError?.message ?? 'Unable to create auth user',
    });
  }

  try {
    const { data: tenantRows, error: tenantError } = await supabaseAdmin.rpc('create_tenant_transaction', {
      p_user_id: authUser.user.id,
      p_workshop_name: workshopName,
      p_slug_base: workshopName,
      p_email: email,
      p_phone: phone,
    });

    if (tenantError) {
      throw tenantError;
    }

    const tenant = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;

    if (!tenant?.tenant_id || !tenant?.tenant_slug) {
      throw new Error('Tenant transaction returned no data');
    }

    const token = signJwt({
      sub: authUser.user.id,
      email,
      role: 'owner',
      tenant_id: tenant.tenant_id,
      tenant_slug: tenant.tenant_slug,
    });

    return res.status(201).json({
      token,
      tenant: {
        id: tenant.tenant_id,
        slug: tenant.tenant_slug,
        trialExpiresAt: tenant.trial_expires_at,
      },
      redirectUrl: `${appUrl}/onboarding/success?tenant=${encodeURIComponent(tenant.tenant_slug)}&token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id).catch((deleteError) => {
      console.error('Failed to rollback auth user:', deleteError);
    });

    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const redirectGoogleAuth = async (_req: Request, res: Response) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const publicAppUrl = process.env.APP_URL;
  const requestOrigin = typeof _req.query.origin === 'string' ? _req.query.origin : null;

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'SUPABASE_URL is required' });
  }

  if (!publicAppUrl) {
    return res.status(500).json({ error: 'APP_URL is required' });
  }

  const resolvedPublicUrl = requestOrigin ?? publicAppUrl;

  if (!isAllowedRedirectUrl(resolvedPublicUrl)) {
    return res.status(400).json({ error: 'Invalid redirect origin' });
  }

  const redirectTo = new URL('/onboarding/google/callback', resolvedPublicUrl).toString();
  const authorizeUrl = new URL('/auth/v1/authorize', supabaseUrl);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', redirectTo);

  return res.redirect(302, authorizeUrl.toString());
};

const googleCompleteSchema = z.object({
  workshopName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  accessToken: z.string().min(1),
});

export const completeGoogleRegistration = async (req: Request, res: Response) => {
  const parsed = googleCompleteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { workshopName, phone, accessToken } = parsed.data;
  const appUrl = resolveAppUrl(typeof req.headers.origin === 'string' ? req.headers.origin : undefined);

  if (!appUrl) {
    return res.status(500).json({ error: 'APP_URL is required' });
  }
  const { data: userResult, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userResult.user) {
    return res.status(401).json({
      error: userError?.message ?? 'Unable to validate Google session',
    });
  }

  const email = userResult.user.email;

  if (!email) {
    return res.status(400).json({
      error: 'Google account does not provide an email',
    });
  }

  try {
    const { data: tenantRows, error: tenantError } = await supabaseAdmin.rpc('create_tenant_transaction', {
      p_user_id: userResult.user.id,
      p_workshop_name: workshopName,
      p_slug_base: workshopName,
      p_email: email,
      p_phone: phone,
    });

    if (tenantError) {
      throw tenantError;
    }

    const tenant = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;

    if (!tenant?.tenant_id || !tenant?.tenant_slug) {
      throw new Error('Tenant transaction returned no data');
    }

    const authPayload = buildAuthPayload(
      { id: userResult.user.id, email },
      { id: tenant.tenant_id, slug: tenant.tenant_slug },
      'owner'
    );

    return res.status(201).json({
      token: authPayload.token,
      user: authPayload.user,
      tenant: {
        id: tenant.tenant_id,
        slug: tenant.tenant_slug,
        trialExpiresAt: tenant.trial_expires_at,
      },
      redirectUrl: `${appUrl}/onboarding/success?tenant=${encodeURIComponent(tenant.tenant_slug)}&token=${encodeURIComponent(authPayload.token)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};

export const exchangeSupabaseSession = async (req: Request, res: Response) => {
  const payloadSchema = z.object({
    accessToken: z.string().min(1),
  });

  const parsed = payloadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { accessToken } = parsed.data;

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

    const authPayload = buildAuthPayload(
      { id: data.user.id, email: data.user.email },
      { id: tenantRow.id, slug: tenantRow.slug },
      userRow.role,
      userRow.branch_id
    );

    return res.status(200).json({
      ...authPayload,
      tenant: {
        id: tenantRow.id,
        slug: tenantRow.slug,
        name: tenantRow.name,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
