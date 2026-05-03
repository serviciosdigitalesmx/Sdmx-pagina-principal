import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { loadSession } from '../services/context.js';

export const handleApi = Router();

// Endpoint para que el frontend valide quién es el usuario logueado
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

// Endpoint de clientes para pruebas
handleApi.get('/api/customers', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: 'No token' });
    
    const token = authHeader.replace('Bearer ', '');
    const session = await loadSession(token);
    
    // Aquí es donde entra tu "Regla de Oro": Validar acceso
    if (!session.accessGranted) {
      return res.status(403).json({ success: false, error: 'SUBSCRIPTION_REQUIRED' });
    }

    res.json({ success: true, data: [] });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { message: error.message } });
  }
});
