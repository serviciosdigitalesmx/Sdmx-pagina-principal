import { Router } from 'express';
import requireAuth from '../middleware/auth.middleware.js';
import { generateOrderPdfAuth, getWhatsAppLink } from '../controllers/operations.controller.js';

const router = Router();

// All routes here require authentication and tenant injection
router.use(requireAuth);

router.post('/orders/:id/pdf', generateOrderPdfAuth);
router.get('/orders/:id/whatsapp', getWhatsAppLink);

export default router;
