import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { attachScope } from '../middleware/scope';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { createCustomer, listCustomers } from '../controllers/catalogs';
import { validate } from '../middleware/validate';
import { createCustomerSchema } from '../schemas/customer';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(attachScope);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/', requireTenantModule('customers'), requireRole('owner', 'manager', 'technician'), listCustomers);
router.post('/', requireTenantModule('customers'), requireRole('owner', 'manager'), validate(createCustomerSchema), createCustomer);

export default router;
