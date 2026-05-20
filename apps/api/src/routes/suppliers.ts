import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { createSupplier, listSuppliers } from '../controllers/suppliers';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', requireRole('owner', 'manager'), listSuppliers);
router.post('/', requireRole('owner', 'manager'), createSupplier);

export default router;
