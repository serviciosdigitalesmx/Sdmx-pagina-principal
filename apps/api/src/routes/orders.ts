import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { addOrderMessage, addOrderNote, createOrder, getOrderById, getOrderChecklist, listOrders, updateOrderChecklist, updateOrderDetails, updateOrderFinancials, updateOrderStatus, updateOrderWarranty, uploadOrderAttachments } from '../controllers/orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);

router.get('/', listOrders);
router.post('/', createOrder);

// Legacy compatibility while migrating clients.
router.get('/legacy', requireRole('owner', 'manager'), listOrders);
router.get('/:id', getOrderById);
router.post('/:id/attachments', uploadOrderAttachments);
router.post('/:id/notes', addOrderNote);
router.post('/:id/messages', addOrderMessage);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/details', updateOrderDetails);
router.patch('/:id/financials', updateOrderFinancials);
router.get('/:id/checklist', getOrderChecklist);
router.put('/:id/checklist', updateOrderChecklist);
router.patch('/:id/warranty', updateOrderWarranty);

export default router;
