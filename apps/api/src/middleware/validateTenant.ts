import { Request, Response, NextFunction } from 'express';

export const validateTenant = (req: Request, res: Response, next: NextFunction) => {
  const urlTenant = req.params.tenantId;
  const tokenTenant = req.user?.tenantId;

  if (!urlTenant) {
    return res.status(400).json({ error: 'Missing tenantId in route params' });
  }

  if (!tokenTenant) {
    return res.status(401).json({ error: 'Missing authenticated tenant context' });
  }

  if (urlTenant !== tokenTenant) {
    return res.status(403).json({ error: 'Tenant mismatch' });
  }

  req.tenantId = tokenTenant;
  next();
};
