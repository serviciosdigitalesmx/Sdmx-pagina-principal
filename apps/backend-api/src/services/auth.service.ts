import { randomUUID } from 'node:crypto';
import { supabase } from './supabase.js';
import { env } from '../config/env.js';
import { loadSession } from './context.js';
import type { RegisterRequestDto, SessionDto, UserDto } from '@sdmx/contracts';

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new Error(message);
};

const syncAuthTenantMetadata = async (authUserId: string, tenantId: string): Promise<void> => {
  await supabase.authAdminUpdate(authUserId, {
    app_metadata: {
      tenant_id: tenantId
    }
  });
};

export const authService = {
  async register(payload: RegisterRequestDto): Promise<UserDto> {
    let tenantId = payload.tenantId;
    const tenantSlug = payload.tenantId.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'default';

    const tenantRows = await supabase.upsertAsService<Array<{ id: string }>>(
      'tenants',
      {
        name: payload.tenantId,
        slug: tenantSlug
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

    await syncAuthTenantMetadata(auth.id, tenantId);

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

  async bootstrapOAuth(token: string): Promise<SessionDto> {
    const auth = await supabase.authUser(token);
    const existingUsers = await supabase.queryAsService<UserDto[]>(
      `users?auth_user_id=eq.${encodeURIComponent(auth.id)}&select=*`
    );

    if (existingUsers[0]) {
      await syncAuthTenantMetadata(auth.id, String(existingUsers[0].tenant_id));
      return this.sessionFromToken(token);
    }

    const email = String(auth.email || '').trim().toLowerCase();
    if (!email) throw new Error('No se pudo resolver el correo del usuario OAuth');

    const localPart = email.split('@')[0] || 'google';
    const tenantSlug = `${localPart.replace(/[^a-z0-9]/g, '-') || 'google'}-${auth.id.slice(0, 8)}`;
    const tenantName = localPart || email;

    const tenantRows = await supabase.upsertAsService<Array<{ id: string }>>(
      'tenants',
      {
        name: tenantName,
        slug: tenantSlug
      },
      'slug'
    );

    const tenantId = String(tenantRows[0].id);
    const fullName = localPart.replace(/[._-]+/g, ' ').trim() || email;

    await supabase.insertAsService<UserDto[]>('users', {
      id: randomUUID(),
      auth_user_id: auth.id,
      tenant_id: tenantId,
      full_name: fullName,
      email
    });
    await syncAuthTenantMetadata(auth.id, tenantId);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + env.trialDays);
    await supabase.insertAsService('subscriptions', {
      tenant_id: tenantId,
      plan: 'enterprise',
      status: 'trialing',
      provider: 'trial',
      external_id: `trial_${tenantId}`,
      current_period_end: trialEndsAt.toISOString(),
      raw_payload: {
        trialDays: env.trialDays,
        trialStartedAt: new Date().toISOString(),
        trialEndsAt: trialEndsAt.toISOString()
      }
    });

    return this.sessionFromToken(token);
  },

  async sessionFromToken(accessToken: string): Promise<SessionDto> {
    const session = await loadSession(accessToken);
    assert(Boolean(session.user), 'Usuario no encontrado');
    return session;
  }
};
