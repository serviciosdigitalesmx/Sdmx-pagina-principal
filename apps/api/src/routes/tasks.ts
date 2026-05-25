import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { createTask, deleteTask, getTaskById, getTaskHistory, listTasks, updateTask, updateTaskStatus } from '../controllers/tasks';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);

router.get('/', requireRole('owner', 'manager', 'technician'), listTasks);
router.post('/', requireRole('owner', 'manager'), createTask);
router.get('/:id', requireRole('owner', 'manager', 'technician'), getTaskById);
router.put('/:id', requireRole('owner', 'manager'), updateTask);
router.patch('/:id/status', requireRole('owner', 'manager', 'technician'), updateTaskStatus);
router.get('/:id/history', requireRole('owner', 'manager', 'technician'), getTaskHistory);
router.delete('/:id', requireRole('owner', 'manager'), deleteTask);

export default router;
