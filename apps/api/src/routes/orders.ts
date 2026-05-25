import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { addOrderNote, createOrder, getOrderById, getOrderChecklist, listOrders, updateOrderChecklist, updateOrderStatus, updateOrderWarranty, uploadOrderAttachments } from '../controllers/orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', listOrders);
router.post('/', createOrder);

// Legacy compatibility while migrating clients.
router.get('/legacy', requireRole('owner', 'manager'), listOrders);
router.get('/:id', getOrderById);
router.post('/:id/attachments', uploadOrderAttachments);
router.post('/:id/notes', addOrderNote);
router.patch('/:id/status', updateOrderStatus);
router.get('/:id/checklist', getOrderChecklist);
router.put('/:id/checklist', updateOrderChecklist);
router.patch('/:id/warranty', updateOrderWarranty);

export default router;
