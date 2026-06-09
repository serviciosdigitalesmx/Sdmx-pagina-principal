import { Router } from 'express';
import { createPublicQuote, createPublicStoreOrder, getPublicPortalOrder, getPublicStoreCatalog, getPublicTenantLanding, trackPublicOrder } from '../controllers/public';

const router = Router({ mergeParams: true });

router.post('/quotes', createPublicQuote);
router.get('/store/:tenantSlug/catalog', getPublicStoreCatalog);
router.post('/store/checkout', createPublicStoreOrder);
router.get('/tracking', trackPublicOrder);
router.get('/tenant/:tenantSlug/landing', getPublicTenantLanding);
router.get('/tenant/:tenantSlug/orders/:folio', getPublicPortalOrder);

export default router;
