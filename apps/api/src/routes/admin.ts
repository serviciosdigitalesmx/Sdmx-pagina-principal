import { Router } from 'express';
import {
  getAdminHealth,
  getAdminTenantAudit,
  getAdminTenantLimits,
  listAdminPlans,
  listAdminTenants,
  patchAdminTenantBillingExempt,
  validateAdminTenantLimit,
} from '../controllers/admin';
import { requireAuth } from '../middleware/auth';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = Router();

router.use(requireAuth);
router.use(requireSuperAdmin);

router.get('/health', getAdminHealth);
router.get('/plans', listAdminPlans);
router.get('/tenants', listAdminTenants);
router.get('/tenants/:tenantId/limits', getAdminTenantLimits);
router.post('/tenants/:tenantId/limits/validate', validateAdminTenantLimit);
router.get('/tenants/:tenantId/audit', getAdminTenantAudit);
router.patch('/tenants/:tenantId/billing-exempt', patchAdminTenantBillingExempt);

export default router;
