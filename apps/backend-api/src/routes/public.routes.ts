import { Router } from 'express';
import { generateOrderPdf, getPublicTenant, createPublicRequest } from '../controllers/pdf.controller'; 
// Nota: Puedes renombrar pdf.controller a public.controller después para limpieza

const router = Router();
router.get('/orders/:folio/pdf', generateOrderPdf);
router.get('/tenants/:slug', getPublicTenant);
router.post('/requests', createPublicRequest);

export default router;
