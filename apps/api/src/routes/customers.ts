import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { createCustomer, listCustomers } from '../controllers/catalogs';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);

router.get('/', requireRole('owner', 'manager', 'technician'), listCustomers);
router.post('/', requireRole('owner', 'manager'), createCustomer);

export default router;
