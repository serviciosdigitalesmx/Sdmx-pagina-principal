import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { attachScope } from '../middleware/scope';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { addOrderMessage, addOrderNote, createOrder, getOrderById, getOrderChecklist, listOrders, updateOrderChecklist, updateOrderDetails, updateOrderFinancials, updateOrderStatus, updateOrderWarranty, uploadOrderAttachments, createOrderPayment } from '../controllers/orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(attachScope);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('orders'), listOrders);
router.post('/', requireTenantModule('orders'), createOrder);

// Legacy compatibility while migrating clients.
router.get('/legacy', requireRole('owner', 'manager'), listOrders);
router.get('/:id', requireTenantModule('orders'), getOrderById);
router.post('/:id/attachments', requireTenantModule('documents'), uploadOrderAttachments);
router.post('/:id/notes', requireTenantModule('orders'), addOrderNote);
router.post('/:id/messages', requireTenantModule('orders'), addOrderMessage);
router.patch('/:id/status', requireTenantModule('orders'), updateOrderStatus);
router.patch('/:id/details', requireTenantModule('orders'), updateOrderDetails);
router.patch('/:id/financials', requireTenantModule('finance'), updateOrderFinancials);
router.post('/:id/payments', requireTenantModule('orders'), requireRole('owner', 'manager'), createOrderPayment);
router.get('/:id/checklist', requireTenantModule('orders'), getOrderChecklist);
router.put('/:id/checklist', requireTenantModule('orders'), updateOrderChecklist);
router.patch('/:id/warranty', requireTenantModule('warranty'), updateOrderWarranty);

export default router;
