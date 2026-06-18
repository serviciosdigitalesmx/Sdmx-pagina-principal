import { Router } from 'express';
import { createPublicQuote, createPublicStoreOrder, getPublicOrderPdf, getPublicPortalOrder, getPublicStoreCatalog, getPublicTenantLanding, trackPublicOrder } from '../controllers/public';

const router = Router({ mergeParams: true });

router.post('/quotes', createPublicQuote);
router.get('/store/:tenantSlug/catalog', getPublicStoreCatalog);
router.post('/store/checkout', createPublicStoreOrder);
router.get('/tracking', trackPublicOrder);
router.get('/tenant/:tenantSlug/landing', getPublicTenantLanding);
router.get('/tenant/:tenantSlug/orders/:folio', getPublicPortalOrder);
router.get('/tenant/:tenantSlug/orders/:folio/pdf', getPublicOrderPdf);

export default router;
