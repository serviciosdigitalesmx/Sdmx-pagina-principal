import { Router } from 'express';
import { register, redirectGoogleAuth, completeGoogleRegistration } from '../controllers/auth.controller';

const router = Router({ mergeParams: true });

router.post('/register', register);
router.get('/google', redirectGoogleAuth);
router.post('/google/complete', completeGoogleRegistration);

export default router;
