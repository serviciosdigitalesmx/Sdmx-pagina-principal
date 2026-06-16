import { Request, Response } from 'express';
import { createHmac, randomUUID } from 'crypto';
import { z } from 'zod';
import { supabaseAdmin } from '@white-label/database';
import { resolveEffectiveUserRole } from '../lib/user-roles';
import { getRequestIp } from '../lib/request-ip';
import { resolveTenantJwtSecret } from '../services/security-backoffice';
import { loadTenantRuntimeConfig } from '../services/tenant-config';

const registerSchema = z.object({
  workshopName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().trim().min(7),
  origin: z.string().url().optional(),
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
    return (
      parsed.hostname.endsWith('serviciosdigitalesmx.online') ||
      parsed.hostname.endsWith('vercel.app') ||
      parsed.hostname.endsWith('vercel-sh.com') ||
      parsed.hostname === 'serviciosdigitalesmx.online' ||
      parsed.hostname === 'api.serviciosdigitalesmx.online' ||
      getAllowedAppOrigins().has(parsed.origin)
    );
  } catch {
    return false;
  }
}

function resolveAppUrl(requestOrigin: string | undefined) {
  const allowedPublicOrigin = Array.from(getAllowedAppOrigins()).find((origin) => {
    try {
      const parsed = new URL(origin);
      return (
        parsed.hostname === 'serviciosdigitalesmx.online' ||
        parsed.hostname === 'www.serviciosdigitalesmx.online' ||
        parsed.hostname.endsWith('vercel.app') ||
        parsed.hostname.endsWith('vercel-sh.com') ||
        (parsed.hostname.endsWith('serviciosdigitalesmx.online') && !parsed.hostname.startsWith('api.') && !parsed.hostname.startsWith('app.'))
      );
    } catch {
      return false;
    }
  });

  if (allowedPublicOrigin) {
    return allowedPublicOrigin;
  }

  const baseDomain = process.env.BASE_DOMAIN?.trim();
  if (baseDomain) {
    const publicAppUrl = `https://${baseDomain.replace(/^https?:\/\//, '').replace(/^app\./, '')}`;
    if (isAllowedRedirectUrl(publicAppUrl)) {
      return publicAppUrl;
    }
  }

  const configuredAppUrl = process.env.APP_URL?.trim();

  if (configuredAppUrl && isAllowedRedirectUrl(configuredAppUrl)) {
    return configuredAppUrl;
  }

  if (requestOrigin && isAllowedRedirectUrl(requestOrigin)) {
    return requestOrigin;
  }

  const fallbackOrigin = Array.from(getAllowedAppOrigins()).find((origin) => isAllowedRedirectUrl(origin));

  return fallbackOrigin ?? null;
}

function resolveSharedCookieDomain() {
  const baseDomain = process.env.BASE_DOMAIN?.trim() || process.env.NEXT_PUBLIC_BASE_DOMAIN?.trim();

  if (baseDomain) {
    const normalized = baseDomain.replace(/^https?:\/\//, '').replace(/^app\./, '');
    return normalized ? `.${normalized}` : undefined;
  }

  return undefined;
}

function buildSharedCookieHeader(token: string) {
  const domain = resolveSharedCookieDomain();
  const attrs = [
    `Path=/`,
    `HttpOnly`,
    `Secure`,
    `SameSite=None`,
    `Max-Age=${60 * 60 * 24 * 7}`,
    domain ? `Domain=${domain}` : undefined,
  ].filter(Boolean);

  return `app_auth_token=${encodeURIComponent(token)}; ${attrs.join('; ')}`;
}

function attachAuthCookie(res: Response, token: string) {
  const existing = res.getHeader('Set-Cookie');
  const cookieHeader = buildSharedCookieHeader(token);

  if (!existing) {
    res.setHeader('Set-Cookie', cookieHeader);
    return;
  }

  const cookies = Array.isArray(existing) ? existing : [String(existing)];
  res.setHeader('Set-Cookie', [...cookies, cookieHeader]);
}

async function signJwt(payload: Record<string, unknown>, tenantId?: string) {
  const secret = tenantId ? await resolveTenantJwtSecret(tenantId) : process.env.JWT_SECRET;

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

async function buildAuthPayload(user: { id: string; email?: string | null }, tenant: { id: string; slug?: string | null }, role: string, sucursalId?: string | null, sessionId?: string) {
  const token = await signJwt({
    sub: user.id,
    email: user.email ?? undefined,
    role,
    tenant_id: tenant.id,
    tenant_slug: tenant.slug ?? undefined,
    sucursal_id: sucursalId ?? undefined,
    session_id: sessionId,
  }, tenant.id);
  return {
    token,
    user: {
      sub: user.id,
      email: user.email ?? null,
      role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug ?? null,
      sucursalId: sucursalId ?? null,
      sessionId: sessionId ?? null,
    },
  };
}

export const register = async (req: Request, res: Response) => {
  console.log('REGISTER_START', {
    timestamp: new Date().toISOString(),
  });

  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { workshopName, email, password, phone, origin } = parsed.data;
  const requestOrigin = origin ?? (typeof req.headers.origin === 'string' ? req.headers.origin : undefined);
  const appUrl = resolveAppUrl(requestOrigin);

  if (!appUrl) {
    console.error('REGISTER_MISSING_APP_URL', { requestOrigin: requestOrigin, configured: process.env.APP_URL });
    return res.status(400).json({ error: 'APP_URL is required or request origin must be allowed' });
  }

  let authUser: any = null;
  try {
    console.log('REGISTER_CREATEUSER_START', {
      email,
      phone,
      workshopName,
    });
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      user_metadata: {
        role: 'owner',
        workshop_name: workshopName,
      },
    });
    authUser = created?.data ? created : { data: created?.data, error: created?.error };
    console.log('REGISTER_CREATEUSER_OK', {
      hasUser: Boolean(created?.data?.user),
      userId: created?.data?.user?.id ?? null,
    });
    if (created?.error || !created?.data?.user) {
      console.error('REGISTER_CREATEUSER_FAILED', { error: created?.error });
      return res.status(409).json({ error: created?.error?.message ?? 'Unable to create auth user' });
    }
  } catch (err) {
    console.error('REGISTER_CREATEUSER_EXCEPTION', err);
    return res.status(500).json({ error: (err as Error).message ?? 'Unable to create auth user' });
  }

  try {
    console.log('REGISTER_RPC_START', {
      authUserId: authUser?.data?.user?.id ?? null,
    });
    const { data: tenantRows, error: tenantError } = await supabaseAdmin.rpc('create_tenant_transaction', {
      p_user_id: authUser.data.user.id,
      p_workshop_name: workshopName,
      p_slug_base: workshopName,
      p_email: email,
      p_phone: phone,
    });

    if (tenantError) {
      throw tenantError;
    }

    const tenant = Array.isArray(tenantRows) ? tenantRows[0] : tenantRows;
    console.log('REGISTER_RPC_OK', {
      tenantRowsType: Array.isArray(tenantRows) ? 'array' : typeof tenantRows,
      tenantId: tenant?.tenant_id ?? null,
      tenantSlug: tenant?.slug ?? tenant?.tenant_slug ?? null,
    });

    // Map database column `slug` to expected `tenant_slug`
    const tenantSlug = tenant.slug ?? tenant.tenant_slug;
    if (!tenant?.tenant_id || !tenantSlug) {
      throw new Error('Tenant transaction returned no data');
    }

    console.log('STEP_TENANT_OBTAINED', { tenantId: tenant.tenant_id, tenantSlug });

    const token = await signJwt({
      sub: authUser.data.user.id,
      email,
      role: 'owner',
      tenant_id: tenant.tenant_id,
      tenant_slug: tenantSlug,
    }, tenant.tenant_id);

    console.log('REGISTER_JWT_OK', {
      tenantId: tenant.tenant_id,
      userId: authUser.data.user.id,
    });

    const redirectUrl = `${appUrl}/onboarding/success?tenant=${encodeURIComponent(tenantSlug)}&token=${encodeURIComponent(token)}`;

    console.log('REGISTER_REDIRECT_OK', {
      redirectUrl,
    });

    console.log('REGISTER_RESPONSE_OK', {
      tenantId: tenant.tenant_id,
      tenantSlug,
    });
    attachAuthCookie(res, token);
    return res.status(201).json({
      token,
      tenant: {
        id: tenant.tenant_id,
        slug: tenantSlug,
        trialExpiresAt: tenant.trial_expires_at,
      },
      billing: {
        subscriptionStatus: 'trial',
        billingExempt: false,
      },
      redirectUrl,
    });
  } catch (error) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.data.user.id).catch((deleteError) => {
      console.error('Failed to rollback auth user:', deleteError);
    });

    console.error('REGISTER_ROOT_ERROR', error);
    console.error((error as any)?.stack);

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
  origin: z.string().url().optional(),
});

export const completeGoogleRegistration = async (req: Request, res: Response) => {
  const parsed = googleCompleteSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid payload',
      details: parsed.error.flatten(),
    });
  }

  const { workshopName, phone, accessToken, origin } = parsed.data;
  const requestOrigin = origin ?? (typeof req.headers.origin === 'string' ? req.headers.origin : undefined);
  const appUrl = resolveAppUrl(requestOrigin);

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
  const tenantSlug = tenant.slug ?? tenant.tenant_slug;
  if (!tenant?.tenant_id || !tenantSlug) {
    throw new Error('Tenant transaction returned no data');
  }
  console.log('STEP_GOOGLE_TENANT_OBTAINED', { tenantId: tenant.tenant_id, tenantSlug });
  const authPayload = await buildAuthPayload(
    { id: userResult.user.id, email },
    { id: tenant.tenant_id, slug: tenantSlug },
    'owner'
  );

    return res.status(201).json({
      token: authPayload.token,
      user: authPayload.user,
      tenant: {
        id: tenant.tenant_id,
        slug: tenantSlug,
        trialExpiresAt: tenant.trial_expires_at,
      },
      billing: {
        subscriptionStatus: 'trial',
        billingExempt: false,
      },
      redirectUrl: `${appUrl}/onboarding/success?tenant=${encodeURIComponent(tenantSlug)}&token=${encodeURIComponent(authPayload.token)}`,
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

    console.log("EXCHANGE_DEBUG", {
      hasError: !!error,
      errorMessage: error?.message,
      userId: data?.user?.id,
      email: data?.user?.email,
    });

    console.log("EXCHANGE_AFTER_GET_USER", {
      hasData: !!data,
      hasUser: !!data?.user,
      hasError: !!error,
    });


    if (error || !data.user) {
      console.error("EXCHANGE_401", {
        error,
        data,
      });

      return res.status(401).json({ error: error?.message ?? 'Unable to validate session' });
    }

    const { data: userRow, error: userRowError } = await supabaseAdmin
      .from('users')
      .select('id, tenant_id, role, sucursal_id, activo, is_active')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    console.log("EXCHANGE_AFTER_USERS_QUERY", {
      hasUserRow: !!userRow,
      userRowError: userRowError?.message ?? null,
      userRowTenantId: userRow?.tenant_id ?? null,
      userRowRole: userRow?.role ?? null,
    });

    if (userRowError) {
      return res.status(502).json({ error: userRowError.message });
    }

    if (!userRow?.tenant_id) {
      return res.status(404).json({ error: 'Tenant not found for authenticated user' });
    }

    if (!(userRow.activo ?? userRow.is_active ?? true)) {
      return res.status(403).json({ error: 'User is inactive' });
    }

    const { data: tenantSecurity, error: tenantSecurityError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, name, require_admin_mfa')
      .eq('id', userRow.tenant_id)
      .maybeSingle();

    console.log("EXCHANGE_AFTER_TENANTS_QUERY", {
      hasTenantSecurity: !!tenantSecurity,
      tenantSecurityError: tenantSecurityError?.message ?? null,
      tenantSecurityId: tenantSecurity?.id ?? null,
      tenantSecuritySlug: tenantSecurity?.slug ?? null,
    });

    if (tenantSecurityError) {
      return res.status(502).json({ error: tenantSecurityError.message });
    }

    if (!tenantSecurity) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantRuntimeConfig = await loadTenantRuntimeConfig(tenantSecurity.id);

    const isAdminRole = resolveEffectiveUserRole(userRow.role) === 'owner';
    if (tenantSecurity.require_admin_mfa && isAdminRole) {
      const { data: mfaRow, error: mfaError } = await supabaseAdmin
        .from('users')
        .select('mfa_enabled')
        .eq('auth_user_id', data.user.id)
        .eq('tenant_id', tenantSecurity.id)
        .maybeSingle();

      if (mfaError) {
        return res.status(502).json({ error: mfaError.message });
      }

      if (!mfaRow?.mfa_enabled) {
        return res.status(403).json({ error: 'MFA required for admin access' });
      }
    }

    const sessionId = randomUUID();
    const authPayload = await buildAuthPayload(
      { id: data.user.id, email: data.user.email },
      { id: tenantSecurity.id, slug: tenantSecurity.slug },
      resolveEffectiveUserRole(userRow.role) ?? userRow.role,
      userRow.sucursal_id,
      sessionId
    );

    console.log("EXCHANGE_AFTER_BUILD_AUTH", {
      sessionId,
      tokenPresent: !!authPayload?.token,
      userSub: authPayload?.user?.sub ?? null,
      tenantId: tenantSecurity.id,
      tenantSlug: tenantSecurity.slug,
    });

    await supabaseAdmin
      .from('users')
      .update({
        ultimo_acceso: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      })
      .eq('auth_user_id', data.user.id)
      .eq('tenant_id', tenantSecurity.id);

    console.log("EXCHANGE_BEFORE_SECURITY_SESSION_INSERT", {
      tenantId: tenantSecurity.id,
      userRowId: userRow.id,
      sessionId,
    });
    const ipAddress = getRequestIp(req.headers, req.ip);
    const { error: sessionInsertError } = await supabaseAdmin.from('security_sessions').insert([{
      tenant_id: tenantSecurity.id,
      user_id: userRow.id,
      session_key: sessionId,
      ip_address: ipAddress,
      user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      last_activity_at: new Date().toISOString(),
    }]);

    console.log("EXCHANGE_AFTER_SECURITY_SESSION_INSERT", {
      sessionInsertError: sessionInsertError?.message ?? null,
      sessionId,
    });

    if (sessionInsertError) {
      return res.status(502).json({ error: sessionInsertError.message });
    }

    console.log("EXCHANGE_BEFORE_ATTACH_COOKIE", {
      tokenPresent: !!authPayload.token,
      sessionId,
      tenantId: tenantSecurity.id,
    });
    attachAuthCookie(res, authPayload.token);

    return res.status(200).json({
      ...authPayload,
      tenant: {
        id: tenantSecurity.id,
        slug: tenantSecurity.slug,
        name: tenantSecurity.name,
        industry_profile: tenantRuntimeConfig.industryProfile,
        enabled_modules: tenantRuntimeConfig.activeModules,
      },
    });
  } catch (error) {
    console.error("EXCHANGE_500_FULL", error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
};
