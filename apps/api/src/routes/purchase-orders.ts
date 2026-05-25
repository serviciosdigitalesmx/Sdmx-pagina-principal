import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import {
  createPurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
  receivePurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
} from '../controllers/purchase-orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);

router.get('/', requireRole('owner', 'manager'), listPurchaseOrders);
router.post('/', requireRole('owner', 'manager'), createPurchaseOrder);
router.get('/:id', requireRole('owner', 'manager'), getPurchaseOrderById);
router.put('/:id', requireRole('owner', 'manager'), updatePurchaseOrder);
router.patch('/:id/status', requireRole('owner', 'manager'), updatePurchaseOrderStatus);
router.post('/:id/receive', requireRole('owner', 'manager'), receivePurchaseOrder);
router.delete('/:id', requireRole('owner', 'manager'), deletePurchaseOrder);

export default router;
