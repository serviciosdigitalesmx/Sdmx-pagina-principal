import { Request, Response, NextFunction } from 'express';
import { loadSession } from '../services/context.js';

export async function requireAuth(req: Request & { session?: any; tenantId?: string }, res: Response, next: NextFunction) {
  try {
    const auth = String(req.headers.authorization || '').trim();
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (req.query?.accessToken as string) || auth || undefined;
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTH', message: 'Authorization token required' } });

    const session = await loadSession(token);
    if (!session) return res.status(401).json({ success: false, error: { code: 'UNAUTH', message: 'Invalid token' } });

    // Attach session and tenant to request for downstream handlers
    req.session = session;
    req.tenantId = session.user.tenant_id;
    // Also attach accessToken for services that expect it
    req.headers['x-access-token'] = token;

    return next();
  } catch (e: any) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTH', message: e.message || 'Unauthorized' } });
  }
}

export default requireAuth;
