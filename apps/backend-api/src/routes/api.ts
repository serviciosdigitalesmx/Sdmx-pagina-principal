import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { loadSession } from '../services/context.js';
import { customersService } from '../services/customers.service.js';
import { serviceOrdersService } from '../services/service-orders.service.js';
import { inventoryService } from '../services/inventory.service.js';
import { financeService } from '../services/finance.service.js';
import { suppliersService } from '../services/suppliers.service.js';
import { reportsService } from '../services/reports.service.js';

export const handleApi = Router();

const withAuth = (fn: (req: any, res: any, token: string) => Promise<any>) => {
  return async (req: any, res: any) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ success: false, error: 'Token missing' });
      const token = authHeader.replace('Bearer ', '');
      await fn(req, res, token);
    } catch (error: any) {
      res.status(error.status || 500).json({ 
        success: false, 
        error: { message: error.message || 'Internal Server Error' } 
      });
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

// --- NEGOCIO (Usando nombres de métodos detectados por tsc) ---

handleApi.get('/api/customers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await customersService.listCustomers(token) });
}));

handleApi.get('/api/service-orders', withAuth(async (req, res, token) => {
  // Cambiado de listOrders a listServiceOrders según auditoría de tipos
  res.json({ success: true, data: await serviceOrdersService.listServiceOrders(token) });
}));

handleApi.get('/api/products', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.listProducts(token) });
}));

handleApi.get('/api/suppliers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await suppliersService.listSuppliers(token) });
}));

handleApi.get('/api/finance/summary', withAuth(async (req, res, token) => {
  // tsc sugirió 'summary' en lugar de 'getSummary'
  res.json({ success: true, data: await financeService.summary(token, req.query) });
}));

handleApi.get('/api/reports/operations', withAuth(async (req, res, token) => {
  // tsc sugirió 'operations' en lugar de 'getOperationsReport'
  res.json({ success: true, data: await reportsService.operations(token, req.query) });
}));
