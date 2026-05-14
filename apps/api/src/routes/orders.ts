import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { createOrder, listOrders } from '../controllers/orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', listOrders);
router.post('/', createOrder);

// Legacy compatibility while migrating clients.
router.get('/legacy', requireRole('owner', 'manager'), listOrders);

export default router;
