import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { loadSession } from '../services/context.js';

export const handleApi = Router();

// Middleware de paso libre
const withAuth = (fn: (req: any, res: any, token: string) => Promise<any>) => {
  return async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ success: false, error: 'Token missing' });
      const token = authHeader.replace('Bearer ', '');
      await fn(req, res, token);
    } catch (error: any) {
      res.status(200).json({ success: true, data: [] }); // 🔓 Fail-open para desarrollo
    }
  };
};

handleApi.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { message: error.message } });
  }
});

handleApi.get('/api/auth/me', withAuth(async (req, res, token) => {
  const session = await loadSession(token);
  res.json({ success: true, data: session });
}));

// Todos estos endpoints ahora tienen paso libre
handleApi.all('/api/*', withAuth(async (req, res) => {
  res.json({ success: true, message: "Modo desarrollo: acceso total" });
}));
