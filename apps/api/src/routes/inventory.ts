import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { createInventoryItem, listInventory, listInventoryMovements, updateInventoryItem } from '../controllers/catalogs';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', requireRole('owner', 'manager', 'technician'), listInventory);
router.post('/', requireRole('owner', 'manager'), createInventoryItem);
router.patch('/:id', requireRole('owner', 'manager'), updateInventoryItem);
router.get('/:id/movements', requireRole('owner', 'manager', 'technician'), listInventoryMovements);

export default router;
