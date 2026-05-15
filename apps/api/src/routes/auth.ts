import { Router } from 'express';
import { register, redirectGoogleAuth } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.get('/google', redirectGoogleAuth);

export default router;
