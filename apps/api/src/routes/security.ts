import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { requireTenantBillingActive } from '../middleware/tenantBilling';
import { requireRole } from '../middleware/requireRole';
import { attachTenantCapabilities, requireTenantModule } from '../middleware/tenantCapabilities';
import { getSecuritySummary, inviteUser } from '../controllers/security';

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use(validateTenant);
router.use(requireTenantBillingActive);
router.use(attachTenantCapabilities);

router.get('/summary', requireTenantModule('security'), getSecuritySummary);
router.post('/users/invite', requireTenantModule('security'), requireRole('owner', 'manager'), inviteUser);

export default router;
