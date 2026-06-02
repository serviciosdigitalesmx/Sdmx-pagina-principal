export type ScopeMode = 'consolidated' | 'branch';

export type ScopeRole = 'owner' | 'manager' | 'technician' | 'client';

export type DashboardScope = {
  mode: ScopeMode;
  tenantId: string;
  tenantSlug: string;
  sucursalId: string | null;
  canUseConsolidatedView: boolean;
  role: ScopeRole;
  source: 'query' | 'tenant' | 'default';
};

let activeScope: DashboardScope | null = null;

function normalizeRole(role: string): ScopeRole {
  const normalized = String(role ?? '').toLowerCase();
  if (normalized === 'owner' || normalized === 'manager' || normalized === 'technician' || normalized === 'client') {
    return normalized;
  }
  return 'manager';
}

export function resolveDashboardScope(input: {
  role: string;
  tenantId: string;
  tenantSlug: string;
  querySucursalId?: string | null;
  defaultSucursalId?: string | null;
}): DashboardScope {
  const role = normalizeRole(input.role);
  const querySucursalId = typeof input.querySucursalId === 'string' && input.querySucursalId.trim().length > 0
    ? input.querySucursalId.trim()
    : null;
  const defaultSucursalId = typeof input.defaultSucursalId === 'string' && input.defaultSucursalId.trim().length > 0
    ? input.defaultSucursalId.trim()
    : null;

  if (role === 'owner') {
    const sucursalId = querySucursalId ?? null;
    return {
      mode: sucursalId ? 'branch' : 'consolidated',
      tenantId: input.tenantId,
      tenantSlug: input.tenantSlug,
      sucursalId,
      canUseConsolidatedView: true,
      role,
      source: querySucursalId ? 'query' : defaultSucursalId ? 'tenant' : 'default',
    };
  }

  const sucursalId = querySucursalId ?? defaultSucursalId ?? null;
  return {
    mode: 'branch',
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    sucursalId,
    canUseConsolidatedView: false,
    role,
    source: querySucursalId ? 'query' : defaultSucursalId ? 'tenant' : 'default',
  };
}

export function setActiveScope(scope: DashboardScope | null) {
  activeScope = scope;
}

export function getActiveScope() {
  return activeScope;
}
