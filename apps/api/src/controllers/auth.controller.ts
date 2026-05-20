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
    const allowedOrigins = getAllowedAppOrigins();
    return allowedOrigins.has(parsed.origin);
  } catch {
    return false;
  }
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

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { workshopName, email, password, phone } = parsed.data;

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
      redirectUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/onboarding/success?tenant=${encodeURIComponent(tenant.tenant_slug)}&token=${encodeURIComponent(token)}`,
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

    const token = signJwt({
      sub: userResult.user.id,
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
      redirectUrl: `${process.env.APP_URL ?? 'http://localhost:3000'}/onboarding/success?tenant=${encodeURIComponent(tenant.tenant_slug)}&token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
