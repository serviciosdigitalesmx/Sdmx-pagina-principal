import { Router } from 'express';
import { createCheckoutPreference } from '../controllers/checkout.controller';

const router = Router();

// POST /api/billing/checkout
router.post('/checkout', createCheckoutPreference);

export default router;
