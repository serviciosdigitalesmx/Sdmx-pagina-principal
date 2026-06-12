import { Request, Response, NextFunction } from 'express';

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const validateTenant = (req: Request, res: Response, next: NextFunction) => {
  const routeTenantSlug = req.params.tenantSlug ?? req.params.tenantId ?? req.params.tenant;
  const tokenTenantSlug = req.user?.tenantSlug ?? null;
  const tokenTenantId = req.user?.tenantId;
  const routeTenantParamType = routeTenantSlug
    ? (isUuidLike(routeTenantSlug) ? 'uuid_like' : 'slug_like')
    : 'missing';
  const tokenTenantIdMatchesRoute = Boolean(routeTenantSlug && tokenTenantId && routeTenantSlug === tokenTenantId);
  const tokenTenantSlugMatchesRoute = Boolean(routeTenantSlug && tokenTenantSlug && routeTenantSlug === tokenTenantSlug);

  console.warn('[tenant-guard]', {
    middlewareName: 'validateTenant',
    method: req.method,
    path: req.originalUrl,
    routeTenantParam: routeTenantSlug ?? null,
    routeTenantParamType,
    tokenTenantIdPresent: Boolean(tokenTenantId),
    tokenTenantSlugPresent: Boolean(tokenTenantSlug),
    tokenTenantIdMatchesRoute,
    tokenTenantSlugMatchesRoute,
  });

  if (!tokenTenantSlug) {
    return res.status(401).json({ error: 'Missing tenant_slug in token' });
  }

  if (routeTenantSlug) {
    const matchesTokenTenant =
      routeTenantSlug === tokenTenantSlug ||
      routeTenantSlug === tokenTenantId ||
      (isUuidLike(routeTenantSlug) && routeTenantSlug === tokenTenantId);

    if (!matchesTokenTenant) {
      return res.status(403).json({ error: 'Tenant mismatch: Route param does not match token' });
    }
  }

  const finalTenantId = tokenTenantId;

  if (!finalTenantId) {
    return res.status(400).json({ error: 'Missing tenant identification in route or token' });
  }

  req.tenantId = finalTenantId;
  next();
};
