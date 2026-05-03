import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller.js';

const router = Router();
router.post('/mercadopago', handleWebhook);
export default router;
