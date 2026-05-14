import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { requireFinanceScope } from '../middleware/financeScope';
import { createExpense, deleteExpense, getBalance, getCashflow, getExpense } from '../controllers/finance';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/balance', requireRole('owner'), getBalance);
router.get('/cashflow/:sucursalId', requireRole('owner', 'manager'), requireFinanceScope, getCashflow);
router.post('/expense', requireRole('owner', 'manager'), requireFinanceScope, createExpense);
router.get('/expense/:id', requireRole('owner', 'manager'), getExpense);
router.delete('/expense/:id', requireRole('owner', 'manager'), deleteExpense);

export default router;
