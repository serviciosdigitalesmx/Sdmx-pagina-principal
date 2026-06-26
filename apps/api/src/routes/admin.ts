import { Router } from 'express';
import {
  getAdminHealth,
  getAdminTenantAudit,
  listAdminTenants,
  patchAdminTenantBillingExempt,
} from '../controllers/admin';
import { requireAuth } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/health', getAdminHealth);
router.get('/tenants', listAdminTenants);
router.get('/tenants/:tenantId/audit', getAdminTenantAudit);
router.patch('/tenants/:tenantId/billing-exempt', patchAdminTenantBillingExempt);

export default router;
