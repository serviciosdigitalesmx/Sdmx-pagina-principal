import { Request, Response, NextFunction } from 'express';

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const resolveTenant = (req: Request, res: Response, next: NextFunction) => {
  const routeTenantSlug = req.params.tenantSlug ?? req.params.tenantId ?? req.params.tenant;
  const tenantId = req.user?.tenantId;
  const tokenTenantSlug = req.user?.tenantSlug ?? null;

  if (!tokenTenantSlug) {
    return res.status(401).json({ error: 'Missing tenant_slug in token' });
  }

  if (routeTenantSlug) {
    const matchesTokenTenant =
      routeTenantSlug === tokenTenantSlug ||
      routeTenantSlug === tenantId ||
      (isUuidLike(routeTenantSlug) && routeTenantSlug === tenantId);

    if (!matchesTokenTenant) {
      return res.status(403).json({ error: 'Tenant mismatch: Route param does not match token' });
    }
  }

  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenant identification in token' });
  }

  req.tenantId = tenantId;
  next();
};
