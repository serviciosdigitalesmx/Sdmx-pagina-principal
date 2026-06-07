import { apiClient } from './api-client';
import { saveAuthToken, clearAuthToken, readAuthToken } from '@/lib/auth-storage';
import { getCurrentSession } from '@/lib/session';
import { resolveAdminApiBaseUrl } from '@/lib/api-base-url';
import type { User, Tenant } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

interface ExchangeResponse {
  token: string;
  user: User;
  tenant: Tenant;
}

export async function exchangeSupabaseSession(accessToken: string): Promise<ExchangeResponse> {
  const apiUrl = resolveAdminApiBaseUrl();

  const response = await fetch(`${apiUrl}/api/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Exchange failed' }));
    throw new Error(error.error || 'Authentication failed');
  }

  const data = await response.json();
  return {
    token: data.token,
    user: data.user,
    tenant: data.tenant,
  };
}

export async function loginWithSupabase(accessToken: string): Promise<LoginResponse> {
  const { token, user, tenant } = await exchangeSupabaseSession(accessToken);
  apiClient.setToken(token);

  saveAuthToken(token, true);
  localStorage.setItem('srf_token', token);
  localStorage.setItem('srf_user', JSON.stringify(user));
  localStorage.setItem('srf_tenant', JSON.stringify(tenant));

  return { token, user, tenant };
}

export function logout() {
  apiClient.clearToken();
  clearAuthToken();
  localStorage.removeItem('srf_token');
  localStorage.removeItem('srf_user');
  localStorage.removeItem('srf_tenant');
  localStorage.removeItem('srf_sucursal_activa');
  window.location.href = '/login';
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('srf_token') || readAuthToken();
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const session = getCurrentSession();
  if (session) {
    return {
      id: session.email || session.tenantId,
      email: session.email,
      name: session.email || 'Usuario activo',
      role: (session.role as User['role']) || 'manager',
      tenantId: session.tenantId,
      tenantSlug: session.tenantSlug,
      sucursalId: session.sucursalId ?? null,
      sessionId: session.token,
    };
  }
  const user = localStorage.getItem('srf_user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function getStoredTenant(): Tenant | null {
  if (typeof window === 'undefined') return null;
  const session = getCurrentSession();
  if (session) {
    return {
      id: session.tenantId,
      slug: session.tenantSlug,
      name: session.tenantSlug,
      branding: {},
      trial_expires_at: '',
      billing_exempt: false,
    };
  }
  const tenant = localStorage.getItem('srf_tenant');
  if (!tenant) return null;
  try {
    return JSON.parse(tenant);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
