import { apiClient } from './api-client';
import { saveAuthToken, clearAuthToken, readAuthToken } from '@/lib/auth-storage';
import { getCurrentSession } from '@/lib/session';
import { resolveAdminApiBaseUrl } from '@/lib/api-base-url';
import { extractTenantRuntimeConfig, saveTenantRuntimeConfig } from '@/lib/tenant-runtime-config';
import { clearBillingExpiredState } from '@/lib/billing-expired';
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
  saveTenantRuntimeConfig(extractTenantRuntimeConfig({ tenant }));
  clearBillingExpiredState();

  try {
    if (tenant?.slug) {
      const apiUrl = resolveAdminApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/auth/tenant/${encodeURIComponent(tenant.slug)}/settings`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const tenantSettings = await response.json().catch(() => null);
        if (tenantSettings) {
          saveTenantRuntimeConfig(extractTenantRuntimeConfig(tenantSettings));
        }
      }
    }
  } catch {
    // If the settings request fails, keep the session alive with the exchange payload.
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem('srf_token', token);
    window.localStorage.removeItem('srf_user');
    window.localStorage.removeItem('srf_tenant');
  }

  return { token, user, tenant };
}

export function logout() {
  apiClient.clearToken();
  clearAuthToken();
  clearBillingExpiredState();

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('srf_token');
    window.localStorage.removeItem('srf_user');
    window.localStorage.removeItem('srf_tenant');
    window.localStorage.removeItem('srf_sucursal_activa');
    window.location.href = '/login';
  }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return readAuthToken() || window.localStorage.getItem('srf_token');
}

export function isAuthenticated(): boolean {
  return !!getCurrentSession() || !!getStoredToken();
}
