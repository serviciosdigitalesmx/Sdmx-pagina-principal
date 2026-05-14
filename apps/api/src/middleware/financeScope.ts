import { Request, Response, NextFunction } from 'express';

export const requireFinanceScope = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (!role) {
    return res.status(401).json({ error: 'Missing authenticated role' });
  }

  if (role === 'owner') {
    return next();
  }

  const routeSucursalId = req.params.sucursalId || req.body?.sucursalId;
  const tokenSucursalId = req.user?.sucursalId;

  if (role === 'manager' && routeSucursalId && tokenSucursalId && routeSucursalId !== tokenSucursalId) {
    return res.status(403).json({ error: 'Sucursal mismatch' });
  }

  next();
};
