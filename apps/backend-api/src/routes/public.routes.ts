import { Router } from 'express';
import { createPublicRequest, generateOrderPdf, getPublicTenant } from '../controllers/public.controller.js';

const router = Router();

router.get('/tenants/:slug', getPublicTenant);
router.post('/requests', createPublicRequest);
router.get('/orders/:folio/pdf', generateOrderPdf);

export default router;
