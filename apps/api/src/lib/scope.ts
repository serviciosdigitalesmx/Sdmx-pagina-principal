import type { Request } from 'express';
import { resolveEffectiveUserRole } from './user-roles';

export type ScopeMode = 'consolidated' | 'branch';
export type ScopeRole = 'owner' | 'manager' | 'technician' | 'client';
export type ScopeSource = 'query' | 'session' | 'token' | 'default';

export interface ScopeContext {
  mode: ScopeMode;
  tenantId: string;
  tenantSlug: string | null;
  sucursalId: string | null;
  canUseConsolidatedView: boolean;
  role: ScopeRole;
  source: ScopeSource;
  requestedSucursalId: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value.trim());
}

function readHeaderValue(headers: Request['headers'], key: string) {
  const value = headers?.[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return typeof value === 'string' ? value.trim() : '';
}

export function getRequestedSucursalId(req: Pick<Request, 'query' | 'params' | 'headers'>): string | null {
  const headerValue = readHeaderValue(req.headers, 'x-fixi-sucursal-id') || readHeaderValue(req.headers, 'x-sucursal-id');
  if (isUuid(headerValue)) {
    return headerValue;
  }

  const queryValue = typeof req.query?.sucursalId === 'string' ? req.query.sucursalId.trim() : '';
  if (isUuid(queryValue)) {
    return queryValue;
  }

  const routeValue = typeof req.params?.sucursalId === 'string' ? req.params.sucursalId.trim() : '';
  if (isUuid(routeValue)) {
    return routeValue;
  }

  return null;
}

export function normalizeScopeRole(role: string | null | undefined): ScopeRole {
  const resolved = resolveEffectiveUserRole(role);
  if (resolved === 'owner') return 'owner';
  if (resolved === 'manager') return 'manager';
  if (resolved === 'technician') return 'technician';
  return 'client';
}
