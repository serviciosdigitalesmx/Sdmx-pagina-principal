import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import {
  checkMovivendorTransactionHandler,
  createMovivendorActivationRequest,
  createMovivendorSaleHandler,
  createMovivendorServiceHandler,
  getMovivendorAccountHandler,
  getMovivendorBalanceHandler,
  getMovivendorProductsHandler,
  getMovivendorStatus,
  getMovivendorTransactionStatusHandler,
  getMovivendorTransactionsHandler,
  listMovivendorActivationRequestsHandler,
  saveMovivendorAccountHandler,
  updateMovivendorActivationRequestHandler,
} from '../controllers/movivendor';

const router = Router({ mergeParams: true });

router.get('/status', requireAuth, validateTenant, getMovivendorStatus);
router.post('/activation-requests', requireAuth, validateTenant, createMovivendorActivationRequest);
router.get('/activation-requests', requireAuth, requireRole('owner'), listMovivendorActivationRequestsHandler);
router.patch('/activation-requests/:id', requireAuth, requireRole('owner'), updateMovivendorActivationRequestHandler);
router.get('/account', requireAuth, validateTenant, requireRole('owner', 'manager'), getMovivendorAccountHandler);
router.put('/account', requireAuth, validateTenant, requireRole('owner', 'manager'), saveMovivendorAccountHandler);
router.get('/products', requireAuth, validateTenant, getMovivendorProductsHandler);
router.get('/balance', requireAuth, validateTenant, getMovivendorBalanceHandler);
router.get('/transactions', requireAuth, validateTenant, getMovivendorTransactionsHandler);
router.get('/transactions/:externalId', requireAuth, validateTenant, getMovivendorTransactionStatusHandler);
router.post('/sales', requireAuth, validateTenant, createMovivendorSaleHandler);
router.post('/services', requireAuth, validateTenant, createMovivendorServiceHandler);
router.post('/check', requireAuth, validateTenant, checkMovivendorTransactionHandler);

export default router;
