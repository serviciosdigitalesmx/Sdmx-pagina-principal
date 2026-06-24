import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { attachScope } from '../middleware/scope';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { addOrderMessage, addOrderNote, createOrder, createOrderWarrantyClaim, getDeviceHistoryBySerial, getOrderById, getOrderChecklist, getOrderWarrantySummary, listOrders, updateOrderChecklist, updateOrderDetails, updateOrderFinancials, updateOrderStatus, updateOrderWarranty, updateOrderWarrantyClaimStatus, uploadOrderAttachments, createOrderPayment, refundOrderPayment, updateOrderDocumentVisibility } from '../controllers/orders';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(attachScope);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('orders'), listOrders);
router.post('/', requireTenantModule('orders'), createOrder);
router.get('/device-history', requireTenantModule('orders'), requireRole('owner', 'manager', 'technician'), getDeviceHistoryBySerial);

// Legacy compatibility while migrating clients.
router.get('/legacy', requireRole('owner', 'manager'), listOrders);
router.get('/:id/warranty', requireTenantModule('warranty'), requireRole('owner', 'manager', 'technician'), getOrderWarrantySummary);
router.post('/:id/warranty/claims', requireTenantModule('warranty'), requireRole('owner', 'manager', 'technician'), createOrderWarrantyClaim);
router.patch('/:id/warranty/claims/:claimId/status', requireTenantModule('warranty'), requireRole('owner', 'manager'), updateOrderWarrantyClaimStatus);
router.get('/:id', requireTenantModule('orders'), getOrderById);
router.post('/:id/attachments', requireTenantModule('documents'), uploadOrderAttachments);
router.patch('/:id/documents/:documentId/visibility', requireTenantModule('documents'), requireRole('owner', 'manager'), updateOrderDocumentVisibility);
router.post('/:id/notes', requireTenantModule('orders'), addOrderNote);
router.post('/:id/messages', requireTenantModule('orders'), addOrderMessage);
router.patch('/:id/status', requireTenantModule('orders'), updateOrderStatus);
router.patch('/:id/details', requireTenantModule('orders'), updateOrderDetails);
router.patch('/:id/financials', requireTenantModule('finance'), updateOrderFinancials);
router.post('/:id/payments', requireTenantModule('orders'), requireRole('owner', 'manager'), createOrderPayment);
router.post('/:id/payments/:paymentId/refund', requireTenantModule('orders'), requireRole('owner', 'manager'), refundOrderPayment);
router.get('/:id/checklist', requireTenantModule('orders'), getOrderChecklist);
router.put('/:id/checklist', requireTenantModule('orders'), updateOrderChecklist);
router.patch('/:id/warranty', requireTenantModule('warranty'), updateOrderWarranty);

export default router;
