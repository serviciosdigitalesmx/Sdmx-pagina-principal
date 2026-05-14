import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { createInventoryItem, listInventory } from '../controllers/catalogs';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', requireRole('owner', 'manager', 'technician'), listInventory);
router.post('/', requireRole('owner', 'manager'), createInventoryItem);

export default router;
