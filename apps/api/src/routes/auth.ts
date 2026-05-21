import { Router } from 'express';
import { register, redirectGoogleAuth, completeGoogleRegistration, exchangeSupabaseSession } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { getCurrentUser, resolveTenantForSupabaseUser } from '../controllers/meta';

const router = Router({ mergeParams: true });

router.post('/register', register);
router.get('/google', redirectGoogleAuth);
router.post('/google/complete', completeGoogleRegistration);
router.post('/exchange', exchangeSupabaseSession);
router.get('/me', requireAuth, getCurrentUser);
router.get('/session', resolveTenantForSupabaseUser);

export default router;
