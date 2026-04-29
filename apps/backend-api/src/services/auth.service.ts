import { randomUUID } from 'node:crypto';
import { supabase } from './supabase.js';
import { env } from '../config/env.js';
import { loadSession } from './context.js';
import type { RegisterRequestDto, SessionDto, UserDto } from '@sdmx/contracts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

export const authService = {
  async register(payload: RegisterRequestDto): Promise<UserDto> {
    let tenantId = payload.tenantId;
    const tenantSlug = payload.tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';
    const billingExempt =
      Boolean(env.masterTenantSlug && tenantSlug === env.masterTenantSlug) ||
      Boolean(env.masterAccountEmail && payload.email.toLowerCase() === env.masterAccountEmail);

    const tenantRows = await supabase.upsertAsService<Array<{ id: string }>>(
      'tenants',
      {
        name: payload.tenantId,
        slug: tenantSlug,
        billing_exempt: billingExempt
      },
      'slug'
    );
    tenantId = String(tenantRows[0].id);

    const auth = await supabase.authAdminCreate(payload.email, payload.password);

    const profile = await supabase.insertAsService<UserDto[]>('users', {
      id: randomUUID(),
      auth_user_id: auth.id,
      tenant_id: tenantId,
      full_name: payload.fullName,
      email: payload.email
    });

    const trialEndsAt = new Date(Date.now() + env.trialDays * 24 * 60 * 60 * 1000).toISOString();
    await supabase.upsertAsService(
      'subscriptions',
      {
        tenant_id: tenantId,
        plan: 'enterprise',
        status: 'trialing',
        provider: 'trial',
        external_id: `trial_${tenantId}`,
        current_period_end: trialEndsAt,
        raw_payload: {
          trialDays: env.trialDays,
          trialStartedAt: new Date().toISOString(),
          trialEndsAt
        }
      },
      'tenant_id'
    );

    return profile[0];
  },

  async login(email: string, password: string): Promise<SessionDto> {
    const auth = await supabase.authLogin(email, password);
    const base = await this.sessionFromToken(auth.access_token);
    return {
      ...base,
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      expiresAt: new Date(Date.now() + ((auth.expires_in ?? 3600) * 1000)).toISOString()
    };
  },

  async sessionFromToken(accessToken: string): Promise<SessionDto> {
    const session = await loadSession(accessToken);
    assert(Boolean(session.user), 'Usuario no encontrado');
    return session;
  }
};
