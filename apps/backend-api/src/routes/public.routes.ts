import { Router } from 'express';
import { getPublicTenant } from '../controllers/public.controller.js';
import { generateOrderPdf } from '../controllers/pdf.controller.js';

const router = Router();
router.get('/tenant/:slug', getPublicTenant);
router.get('/pdf/order/:folio', generateOrderPdf);
export default router;
