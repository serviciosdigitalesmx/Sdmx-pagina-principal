import { Request, Response, NextFunction } from 'express';

export const resolveTenant = (req: Request, res: Response, next: NextFunction) => {
  const routeTenantId = req.params.tenantId;
  const tenantId = routeTenantId || req.user?.tenantId;

  if (!tenantId) {
    return res.status(400).json({ error: 'Missing tenantId in route params' });
  }

  if (req.user?.tenantId && req.user.tenantId !== tenantId) {
    return res.status(403).json({ error: 'Invalid tenant' });
  }

  req.tenantId = tenantId;
  next();
};
