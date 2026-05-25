import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireRole } from '../middleware/requireRole';
import { createSupplier, deleteSupplier, getSupplierById, listSuppliers, updateSupplier } from '../controllers/suppliers';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);

router.get('/', requireRole('owner', 'manager'), listSuppliers);
router.post('/', requireRole('owner', 'manager'), createSupplier);
router.get('/:id', requireRole('owner', 'manager'), getSupplierById);
router.put('/:id', requireRole('owner', 'manager'), updateSupplier);
router.delete('/:id', requireRole('owner', 'manager'), deleteSupplier);

export default router;
