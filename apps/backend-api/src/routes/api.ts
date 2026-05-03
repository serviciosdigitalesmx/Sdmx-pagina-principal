// api.ts
import { Router } from 'express';
import { loadSession, requireActiveSubscription } from '../services/context.js';

export const handleApi = Router();

// Middleware de autenticación real
const authenticate = () => {
  return async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '').trim();
      if (!token) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token no proporcionado' } });
      }
      const session = await loadSession(token);
      req.session = session;
      req.token = token;
      next();
    } catch (error: any) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: error.message || 'Token inválido' } });
    }
  };
};

// Endpoints públicos (sin autenticación)
handleApi.post('/api/auth/login', (req, res) => { /* implementar */ });
handleApi.post('/api/auth/register', (req, res) => { /* implementar */ });
handleApi.post('/api/auth/refresh', (req, res) => { /* implementar */ });
handleApi.post('/api/webhooks/mercadopago', (req, res) => { /* implementar */ });
handleApi.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Middleware para endpoints que requieren suscripción activa (opcional)
const requireActive = (req: any, res: any, next: any) => {
  try {
    requireActiveSubscription(req.session);
    next();
  } catch (error: any) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: error.message } });
  }
};

// Endpoints protegidos (autenticación + suscripción opcional)
handleApi.get('/api/subscription/status', authenticate(), async (req: any, res) => {
  res.json({ success: true, data: { status: req.session.subscription.status, plan: req.session.subscription.plan, accessGranted: req.session.accessGranted } });
});

handleApi.get('/api/auth/me', authenticate(), async (req: any, res) => {
  res.json({ success: true, data: { user: req.session.user, accessGranted: req.session.accessGranted } });
});

// Ejemplo de endpoint que requiere suscripción activa
handleApi.post('/api/service-orders', authenticate(), requireActive, async (req, res) => {
  // lógica de creación
});

// Catch-all para otros endpoints protegidos (requiere al menos autenticación)
handleApi.all('/api/*', authenticate(), async (req: any, res) => {
  // Si llegó hasta aquí, el token es válido. Se puede responder un mensaje genérico o continuar.
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint no existe' } });
});
