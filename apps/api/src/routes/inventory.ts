import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { attachScope } from '../middleware/scope';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { createInventoryItem, listInventory, listInventoryMovements, transferInventoryItem, updateInventoryItem } from '../controllers/catalogs';
import { createInventoryReservation, listInventoryReservations, releaseInventoryReservation } from '../controllers/inventory-reservations';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(attachScope);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('stock'), requireRole('owner', 'manager', 'technician'), listInventory);
router.post('/', requireTenantModule('stock'), requireRole('owner', 'manager'), createInventoryItem);
router.post('/transfer', requireTenantModule('stock'), requireRole('owner', 'manager'), transferInventoryItem);
router.get('/reservations', requireTenantModule('stock'), requireRole('owner', 'manager', 'technician'), listInventoryReservations);
router.post('/reservations', requireTenantModule('stock'), requireRole('owner', 'manager'), createInventoryReservation);
router.patch('/reservations/:id/release', requireTenantModule('stock'), requireRole('owner', 'manager'), releaseInventoryReservation);
router.patch('/:id', requireTenantModule('stock'), requireRole('owner', 'manager'), updateInventoryItem);
router.get('/:id/movements', requireTenantModule('stock'), requireRole('owner', 'manager', 'technician'), listInventoryMovements);

export default router;
