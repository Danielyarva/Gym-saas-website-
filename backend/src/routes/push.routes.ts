import { Router } from 'express';
import * as pushController from '../controllers/push.controller';
import { authenticate } from '../middleware/authenticate';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { subscribePushSchema, unsubscribePushSchema } from '../schemas/push.schema';

// Flat/top-level, any authenticated role — self-scoped by req.user.id, no client-ownership concept.
const router = Router();

router.use(authenticate);

router.get('/vapid-public-key', pushController.getVapidPublicKey);
router.post('/subscribe', csrfProtection, validate(subscribePushSchema), pushController.subscribe);
router.post('/unsubscribe', csrfProtection, validate(unsubscribePushSchema), pushController.unsubscribe);

export default router;
