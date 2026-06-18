import { Router } from 'express';
import { register, redirectGoogleAuth, completeGoogleRegistration, exchangeSupabaseSession } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validateTenant } from '../middleware/validateTenant';
import { getCurrentUser, resolveTenantForSupabaseUser, getTenantSettings, updateTenantSettings, uploadTenantBrandingAsset } from '../controllers/meta';

const router = Router({ mergeParams: true });

router.post('/register', register);
router.get('/google', redirectGoogleAuth);
router.post('/google/complete', completeGoogleRegistration);
router.post('/exchange', exchangeSupabaseSession);
router.get('/me', requireAuth, getCurrentUser);
router.get('/session', resolveTenantForSupabaseUser);
router.get('/tenant/:tenantSlug/settings', requireAuth, validateTenant, getTenantSettings);
router.put('/tenant/:tenantSlug/settings', requireAuth, validateTenant, updateTenantSettings);
router.post('/tenant/:tenantSlug/assets', requireAuth, validateTenant, uploadTenantBrandingAsset);

export default router;
