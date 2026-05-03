import { Router } from 'express';
import { authService } from '../services/auth.service.js';
import { billingService } from '../services/billing.service.js';
import { loadSession, requireActiveSubscription } from '../services/context.js';
import { customersService } from '../services/customers.service.js';
import { serviceOrdersService } from '../services/service-orders.service.js';
import { inventoryService } from '../services/inventory.service.js';
import { financeService } from '../services/finance.service.js';
import { suppliersService } from '../services/suppliers.service.js';
import { reportsService } from '../services/reports.service.js';
import { purchasesService } from '../services/purchases.service.js';
import { expensesService } from '../services/expenses.service.js';
import { subscriptionService } from '../services/subscription.service.js';

export const handleApi = Router();

type AuthedHandler = (req: any, res: any, token: string, session: Awaited<ReturnType<typeof loadSession>>) => Promise<void>;

const withAuth = (fn: AuthedHandler) => {
  return async (req: any, res: any) => {
    try {
      const authHeader = String(req.headers.authorization || '');
      if (!authHeader.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token missing' } });
      }
      const token = authHeader.slice(7).trim();
      if (!token) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token missing' } });
      }
      const session = await loadSession(token);
      requireActiveSubscription(session);
      await fn(req, res, token, session);
    } catch (error: any) {
      res.status(error?.status || 500).json({
        success: false,
        error: { code: error?.code || 'DOMAIN_ERROR', message: error?.message || 'Internal Server Error' }
      });
    }
  };
};

const queryString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  return value.trim() || null;
};

handleApi.post('/api/auth/login', async (req, res) => {
  try {
    const result = await authService.login(String(req.body?.email || ''), String(req.body?.password || ''));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { code: 'AUTH_ERROR', message: error?.message || 'Login failed' } });
  }
});

handleApi.post('/api/auth/refresh', async (req, res) => {
  try {
    const refreshToken = String(req.body?.refreshToken || req.body?.refresh_token || '');
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'refreshToken es obligatorio' } });
    }
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: { code: 'AUTH_ERROR', message: error?.message || 'Refresh failed' } });
  }
});

handleApi.get('/api/auth/me', withAuth(async (req, res, token, session) => {
  res.json({ success: true, data: session });
}));

handleApi.post('/api/auth/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: error?.message || 'Register failed' } });
  }
});

handleApi.post('/api/auth/bootstrap-oauth', async (req, res) => {
  try {
    const token = String(req.body?.accessToken || req.body?.token || '');
    if (!token) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'accessToken es obligatorio' } });
    }
    const result = await authService.bootstrapOAuth(token);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: error?.message || 'Bootstrap failed' } });
  }
});

handleApi.get('/api/portal/orders/:folio', async (req, res) => {
  try {
    const folio = String(req.params.folio || '').trim();
    if (!folio) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Folio es obligatorio' } });
    }
    const data = await serviceOrdersService.getPortalOrderPublic(folio);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'DOMAIN_ERROR', message: error?.message || 'Portal lookup failed' } });
  }
});

handleApi.get('/api/subscription/status', withAuth(async (req, res, token) => {
  const data = await subscriptionService.subscriptionStatus(token);
  res.json({ success: true, data });
}));

handleApi.post('/api/billing/checkout', withAuth(async (req, res, token) => {
  const result = await billingService.createCheckout(token, req.body);
  res.json({ success: true, data: result });
}));

handleApi.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const signature = String(req.headers['x-signature'] || req.headers['x-mercadopago-signature'] || '');
    const requestId = String(req.headers['x-request-id'] || '');
    const result = await billingService.handleMercadoPagoWebhook(req.body, signature, requestId);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: { code: 'WEBHOOK_ERROR', message: error?.message || 'Webhook failed' } });
  }
});

handleApi.get('/api/customers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await customersService.listCustomers(token) });
}));
handleApi.post('/api/customers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await customersService.createCustomer(token, req.body) });
}));
handleApi.get('/api/customers/:customerId/contacts', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await customersService.listCustomerContacts(token, String(req.params.customerId)) });
}));
handleApi.post('/api/customers/:customerId/contacts', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await customersService.createCustomerContact(token, { ...req.body, customerId: String(req.params.customerId) }) });
}));

handleApi.get('/api/service-orders', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await serviceOrdersService.listServiceOrders(token) });
}));
handleApi.post('/api/service-orders', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await serviceOrdersService.createServiceOrder(token, req.body) });
}));
handleApi.put('/api/service-orders/:serviceOrderId/status', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await serviceOrdersService.updateServiceOrderStatus(token, String(req.params.serviceOrderId), req.body) });
}));
handleApi.get('/api/service-orders/:serviceOrderId/timeline', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await serviceOrdersService.listStatusTimeline(token, String(req.params.serviceOrderId)) });
}));
handleApi.post('/api/evidences/signed-upload', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await serviceOrdersService.signedUpload(token, req.body) });
}));

handleApi.get('/api/products', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.listProducts(token) });
}));
handleApi.post('/api/products', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.createProduct(token, req.body) });
}));
handleApi.patch('/api/products/:productId', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.updateProduct(token, String(req.params.productId), req.body) });
}));
handleApi.get('/api/products/:productId/kardex', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.getKardex(token, String(req.params.productId)) });
}));
handleApi.get('/api/inventory/movements', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.listMovements(token, queryString(req.query.product_id) || undefined) });
}));
handleApi.post('/api/inventory/movements', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await inventoryService.createMovement(token, req.body) });
}));

handleApi.get('/api/suppliers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await suppliersService.listSuppliers(token) });
}));
handleApi.post('/api/suppliers', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await suppliersService.createSupplier(token, req.body) });
}));
handleApi.patch('/api/suppliers/:supplierId', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await suppliersService.updateSupplier(token, String(req.params.supplierId), req.body) });
}));
handleApi.delete('/api/suppliers/:supplierId', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await suppliersService.deleteSupplier(token, String(req.params.supplierId)) });
}));

handleApi.get('/api/expense-categories', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await expensesService.listCategories(token) });
}));
handleApi.post('/api/expense-categories', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await expensesService.createCategory(token, req.body) });
}));
handleApi.get('/api/expenses', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await expensesService.listExpenses(token) });
}));
handleApi.post('/api/expenses', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await expensesService.createExpense(token, req.body) });
}));
handleApi.delete('/api/expenses/:expenseId', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await expensesService.deleteExpense(token, String(req.params.expenseId)) });
}));

handleApi.get('/api/purchases', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await purchasesService.listPurchases(token) });
}));
handleApi.post('/api/purchases', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await purchasesService.createPurchase(token, req.body) });
}));
handleApi.post('/api/purchases/:purchaseId/confirm', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await purchasesService.confirmPurchase(token, String(req.params.purchaseId), req.body) });
}));
handleApi.post('/api/purchases/:purchaseId/cancel', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await purchasesService.cancelPurchase(token, String(req.params.purchaseId)) });
}));

handleApi.get('/api/finance/summary', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await financeService.summary(token, req.query) });
}));
handleApi.get('/api/finance/monthly', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await financeService.monthly(token, req.query) });
}));
handleApi.get('/api/finance/transactions', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await financeService.transactions(token, req.query) });
}));

handleApi.get('/api/reports/operations', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await reportsService.operations(token, req.query) });
}));
handleApi.get('/api/reports/finance', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await reportsService.finance(token, req.query) });
}));
handleApi.get('/api/reports/inventory', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await reportsService.inventory(token, req.query) });
}));
handleApi.get('/api/reports/purchases-expenses', withAuth(async (req, res, token) => {
  res.json({ success: true, data: await reportsService.purchasesExpenses(token, req.query) });
}));
