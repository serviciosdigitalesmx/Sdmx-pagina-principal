import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { convertServiceRequestToOrder, getServiceRequestById, listServiceRequests } from '../controllers/requests';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);

router.get('/', requireRole('owner', 'manager', 'technician'), listServiceRequests);
router.get('/:id', requireRole('owner', 'manager', 'technician'), getServiceRequestById);
router.post('/:id/convert', requireRole('owner', 'manager'), convertServiceRequestToOrder);

export default router;
