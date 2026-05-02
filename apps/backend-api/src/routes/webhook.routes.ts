import { Router } from 'express';
import { handleMercadoPagoWebhook } from '../controllers/webhook.controller';

const router = Router();

// Endpoint: POST /api/webhooks/mercadopago
router.post('/mercadopago', handleMercadoPagoWebhook);

export default router;
