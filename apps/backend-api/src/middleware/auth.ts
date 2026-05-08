import { Request, Response, NextFunction } from 'express';
import { loadSession } from '../services/context.js';

export type AuthRequest = Request & {
  token?: string;
  user?: any;
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado: token requerido' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const session = await loadSession(token);
    if (!session) throw new Error('Sesión inválida');
    req.token = token;
    req.user = session.user;
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Token inválido' });
  }
};
