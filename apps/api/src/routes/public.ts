import { Router } from 'express';
import { createPublicQuote, trackPublicOrder } from '../controllers/public';

const router = Router({ mergeParams: true });

router.post('/quotes', createPublicQuote);
router.get('/tracking', trackPublicOrder);

export default router;
