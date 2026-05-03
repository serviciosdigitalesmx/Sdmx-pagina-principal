import { Router } from 'express';
import { appService } from '../domain/app-service.js';
import { loadSession } from '../services/context.js';

const router = Router();

const authenticate = () => async (req: any, res: any, next: any) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token requerido' } });
    const session = await loadSession(token);
    req.session = session;
    req.token = token;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: err.message } });
  }
};

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const session = await appService.login(email, password);
    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'AUTH_ERROR', message: err.message } });
  }
});
router.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const session = await appService.refreshSession(refreshToken);
    res.json({ success: true, data: session });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'REFRESH_ERROR', message: err.message } });
  }
});
router.post('/api/auth/logout', authenticate(), (req, res) => res.json({ success: true, data: null }));
router.get('/api/auth/me', authenticate(), (req, res) => res.json({ success: true, data: req.session }));

router.get('/api/customers', authenticate(), async (req, res) => {
  const data = await appService.listCustomers(req.token);
  res.json({ success: true, data });
});
router.post('/api/customers', authenticate(), async (req, res) => {
  const data = await appService.createCustomer(req.token, req.body);
  res.json({ success: true, data });
});
router.get('/api/customers/:id/contacts', authenticate(), async (req, res) => {
  const data = await appService.listCustomerContacts(req.token, req.params.id);
  res.json({ success: true, data });
});
router.post('/api/customers/contacts', authenticate(), async (req, res) => {
  const data = await appService.createCustomerContact(req.token, req.body);
  res.json({ success: true, data });
});

router.get('/api/service-orders', authenticate(), async (req, res) => {
  const data = await appService.listServiceOrders(req.token);
  res.json({ success: true, data });
});
router.post('/api/service-orders', authenticate(), async (req, res) => {
  const data = await appService.createServiceOrder(req.token, req.body);
  res.json({ success: true, data });
});
router.patch('/api/service-orders/:id/status', authenticate(), async (req, res) => {
  const data = await appService.updateServiceOrderStatus(req.token, req.params.id, req.body);
  res.json({ success: true, data });
});

router.get('/api/inventory-products', authenticate(), async (req, res) => {
  const data = await appService.listInventoryProducts(req.token);
  res.json({ success: true, data });
});
router.post('/api/inventory-products', authenticate(), async (req, res) => {
  const data = await appService.createInventoryProduct(req.token, req.body);
  res.json({ success: true, data });
});
router.patch('/api/inventory-products/:id', authenticate(), async (req, res) => {
  const data = await appService.updateInventoryProduct(req.token, req.params.id, req.body);
  res.json({ success: true, data });
});
router.get('/api/inventory-movements', authenticate(), async (req, res) => {
  const data = await appService.listInventoryMovements(req.token, req.query.productId as string);
  res.json({ success: true, data });
});
router.post('/api/inventory-movements', authenticate(), async (req, res) => {
  const data = await appService.createInventoryMovement(req.token, req.body);
  res.json({ success: true, data });
});

router.get('/api/suppliers', authenticate(), async (req, res) => {
  const data = await appService.listSuppliers(req.token);
  res.json({ success: true, data });
});
router.post('/api/suppliers', authenticate(), async (req, res) => {
  const data = await appService.createSupplier(req.token, req.body);
  res.json({ success: true, data });
});
router.get('/api/suppliers/:id', authenticate(), async (req, res) => {
  const data = await appService.getSupplierById(req.token, req.params.id);
  res.json({ success: true, data });
});
router.patch('/api/suppliers/:id', authenticate(), async (req, res) => {
  const data = await appService.updateSupplier(req.token, req.params.id, req.body);
  res.json({ success: true, data });
});
router.delete('/api/suppliers/:id', authenticate(), async (req, res) => {
  const data = await appService.deleteSupplier(req.token, req.params.id);
  res.json({ success: true, data });
});

router.get('/api/expense-categories', authenticate(), async (req, res) => {
  const data = await appService.listExpenseCategories(req.token);
  res.json({ success: true, data });
});
router.post('/api/expense-categories', authenticate(), async (req, res) => {
  const data = await appService.createExpenseCategory(req.token, req.body);
  res.json({ success: true, data });
});
router.get('/api/expenses', authenticate(), async (req, res) => {
  const data = await appService.listExpenses(req.token);
  res.json({ success: true, data });
});
router.post('/api/expenses', authenticate(), async (req, res) => {
  const data = await appService.createExpense(req.token, req.body);
  res.json({ success: true, data });
});
router.delete('/api/expenses/:id', authenticate(), async (req, res) => {
  const data = await appService.deleteExpense(req.token, req.params.id);
  res.json({ success: true, data });
});

router.get('/api/purchases', authenticate(), async (req, res) => {
  const data = await appService.listPurchases(req.token);
  res.json({ success: true, data });
});
router.post('/api/purchases', authenticate(), async (req, res) => {
  const data = await appService.createPurchase(req.token, req.body);
  res.json({ success: true, data });
});
router.post('/api/purchases/:id/confirm', authenticate(), async (req, res) => {
  const data = await appService.confirmPurchase(req.token, req.params.id, req.body);
  res.json({ success: true, data });
});
router.post('/api/purchases/:id/cancel', authenticate(), async (req, res) => {
  const data = await appService.cancelPurchase(req.token, req.params.id);
  res.json({ success: true, data });
});

router.get('/api/dashboard/summary', authenticate(), async (req, res) => {
  const data = await appService.dashboardSummary(req.token);
  res.json({ success: true, data });
});
router.get('/api/finance/summary', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.financeSummary(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/finance/monthly', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.financeMonthly(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/finance/transactions', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.financeTransactions(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/reports/operations', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.operationsReport(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/reports/finance', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.financeReport(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/reports/inventory', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.inventoryReport(req.token, from as string, to as string);
  res.json({ success: true, data });
});
router.get('/api/reports/purchases-expenses', authenticate(), async (req, res) => {
  const { from, to } = req.query;
  const data = await appService.purchasesExpensesReport(req.token, from as string, to as string);
  res.json({ success: true, data });
});

router.post('/api/uploads/signed', authenticate(), async (req, res) => {
  const data = await appService.signedUpload(req.token, req.body);
  res.json({ success: true, data });
});
router.get('/api/public/orders/:folio/pdf', async (req, res) => {
  const pdf = await appService.getPortalOrderPublic(req.params.folio);
  res.setHeader('Content-Type', 'application/pdf');
  res.send(pdf);
});

router.post('/api/billing/checkout', authenticate(), async (req, res) => {
  const data = await appService.createCheckout(req.token, req.body);
  res.json({ success: true, data });
});
router.post('/api/webhooks/mercadopago', async (req, res) => {
  await appService.handleMercadoPagoWebhook(req.body, req.headers['x-signature'] as string, req.headers['x-request-id'] as string);
  res.json({ received: true });
});

export const handleApi = router;
