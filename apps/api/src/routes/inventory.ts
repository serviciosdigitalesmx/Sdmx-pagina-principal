import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { createInventoryItem, listInventory, listInventoryMovements, updateInventoryItem } from '../controllers/catalogs';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('stock'), requireRole('owner', 'manager', 'technician'), listInventory);
router.post('/', requireTenantModule('stock'), requireRole('owner', 'manager'), createInventoryItem);
router.patch('/:id', requireTenantModule('stock'), requireRole('owner', 'manager'), updateInventoryItem);
router.get('/:id/movements', requireTenantModule('stock'), requireRole('owner', 'manager', 'technician'), listInventoryMovements);

export default router;
