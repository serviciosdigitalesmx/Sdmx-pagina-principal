import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { subscriptionService } from '../services/subscription.service.js';

export const handleApi = Router();

// Middleware simple para normalizar la URL antes de cualquier lógica
handleApi.use((req, res, next) => {
  // Evita que constructores de URL truenen si el host no viene completo
  req.app.set('trust proxy', true);
  next();
});

handleApi.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { message: error.message } });
  }
});

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

// Endpoint de prueba que usas en test-auth.sh
handleApi.get('/api/customers', async (req, res) => {
  res.json({ success: true, data: [] });
});
