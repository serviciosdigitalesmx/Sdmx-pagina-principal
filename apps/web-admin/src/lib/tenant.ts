import { getStoredUser, getStoredTenant } from './auth';

export function getTenantSlug(): string | null {
  const tenant = getStoredTenant();
  return tenant?.slug || null;
}

export function getTenantId(): string | null {
  const tenant = getStoredTenant();
  return tenant?.id || null;
}

export function getCurrentUserSucursalId(): string | null {
  const user = getStoredUser();
  return user?.sucursalId || null;
}

export function getActiveSucursalId(): string | null {
  if (typeof window === 'undefined') return null;
  // First check localStorage (user selection)
  const stored = localStorage.getItem('srf_sucursal_activa');
  if (stored && stored !== 'GLOBAL') return stored;

  // Then fallback to user's assigned sucursal
  return getCurrentUserSucursalId();
}

export function setActiveSucursalId(sucursalId: string | null) {
  if (typeof window === 'undefined') return;
  if (!sucursalId || sucursalId === 'GLOBAL') {
    localStorage.removeItem('srf_sucursal_activa');
  } else {
    localStorage.setItem('srf_sucursal_activa', sucursalId);
  }
  // Reload to refresh all queries with new sucursal context
  window.location.reload();
}

export function canUseConsolidatedView(): boolean {
  const user = getStoredUser();
  return user?.role === 'owner';
}

export function getApiOptions() {
  return {
    tenantSlug: getTenantSlug() || undefined,
    sucursalId: getActiveSucursalId(),
  };
}
