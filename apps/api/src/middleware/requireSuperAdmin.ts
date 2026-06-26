import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@white-label/database';

function normalize(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase();
}

function allowedAdminEmails() {
  const platformEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map(normalize)
    .filter(Boolean);
  const masterEmail = normalize(process.env.MASTER_ACCOUNT_EMAIL);

  return new Set([...platformEmails, masterEmail].filter(Boolean));
}

function deny(res: Response, requestId?: string) {
  return res.status(403).json({
    error: 'Acceso no autorizado',
    requestId: requestId ?? null,
  });
}

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const requestId = req.requestId;
    const user = req.user;
    const masterTenantSlug = normalize(process.env.MASTER_TENANT_SLUG);

    if (!user?.tenantId || !user.userId || !user.email || !masterTenantSlug) {
      return deny(res, requestId);
    }

    if (user.role !== 'owner') {
      return deny(res, requestId);
    }

    const allowedEmails = allowedAdminEmails();
    if (!allowedEmails.has(normalize(user.email))) {
      return deny(res, requestId);
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id, slug, require_admin_mfa')
      .eq('id', user.tenantId)
      .maybeSingle();

    if (tenantError || !tenantRow || normalize(tenantRow.slug) !== masterTenantSlug) {
      return deny(res, requestId);
    }

    if (tenantRow.require_admin_mfa) {
      const { data: mfaRow, error: mfaError } = await supabaseAdmin
        .from('users')
        .select('id, mfa_enabled, mfa_verified_at')
        .eq('id', user.userId)
        .eq('tenant_id', user.tenantId)
        .maybeSingle();

      if (mfaError || !mfaRow?.mfa_enabled || !mfaRow.mfa_verified_at) {
        return deny(res, requestId);
      }
    }

    next();
  } catch {
    return deny(res, req.requestId);
  }
}
