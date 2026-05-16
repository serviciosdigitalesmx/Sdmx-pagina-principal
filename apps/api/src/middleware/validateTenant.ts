import { Request, Response, NextFunction } from 'express';

export const validateTenant = (req: Request, res: Response, next: NextFunction) => {
  const urlTenant = req.params.tenantId;
  const tokenTenant = req.user?.tenantId;

  // If both are present, they must match
  if (urlTenant && tokenTenant && urlTenant !== tokenTenant) {
    return res.status(403).json({ error: 'Tenant mismatch: Route param does not match token' });
  }

  // Use token tenant as primary source of truth if authenticated
  const finalTenantId = tokenTenant || urlTenant;

  if (!finalTenantId) {
    return res.status(400).json({ error: 'Missing tenant identification in route or token' });
  }

  req.tenantId = finalTenantId;
  next();
};
