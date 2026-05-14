import { Request, Response, NextFunction } from 'express';

type Role = 'owner' | 'manager' | 'technician';

const roleRank: Record<Role, number> = {
  owner: 3,
  manager: 2,
  technician: 1,
};

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentRole = req.user?.role;

    if (!currentRole) {
      return res.status(401).json({ error: 'Missing authenticated role' });
    }

    const currentRank = roleRank[currentRole];
    const hasAccess = allowedRoles.some((role) => roleRank[role] <= currentRank);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
