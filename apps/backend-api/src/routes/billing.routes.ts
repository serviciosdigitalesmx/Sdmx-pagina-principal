import { Router } from 'express';
import { createCheckout } from '../controllers/checkout.controller.js';

const router = Router();
router.post('/checkout', createCheckout);
export default router;
