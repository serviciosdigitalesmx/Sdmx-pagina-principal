import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { loadSession } from '../services/context.js';

export const handleApi = Router();

// --- ENDPOINTS DE AUTENTICACIÓN ---

handleApi.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { message: error.message } });
  }
});

handleApi.post('/api/auth/refresh', async (req, res) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { message: error.message } });
  }
});

handleApi.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'No token' });
    
    const token = authHeader.replace('Bearer ', '');
    const session = await loadSession(token);
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { message: error.message } });
  }
});

// --- ENDPOINTS DE NEGOCIO (Para evitar 404s) ---

handleApi.get('/api/customers', async (req, res) => {
  res.json({ success: true, data: [] });
});

handleApi.get('/api/subscription/status', async (req, res) => {
  res.json({ success: true, data: { status: 'active' } });
});
