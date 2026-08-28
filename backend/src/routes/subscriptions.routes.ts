import { Router } from 'express';
import * as subscriptionsController from '../controllers/subscriptions.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { checkoutSchema, verifyPaymentSchema, listPaymentsQuerySchema } from '../schemas/subscription.schema';

const router = Router();

// Deliberately unauthenticated — Razorpay calls this directly, and the
// signature check inside the handler is the authentication.
router.post('/webhook', subscriptionsController.webhook);

router.use(authenticate);

router.get('/', requireRole('COACH'), subscriptionsController.getStatus);
router.get('/payments', requireRole('COACH'), validate(listPaymentsQuerySchema, 'query'), subscriptionsController.listPayments);
router.post('/checkout', requireRole('COACH'), csrfProtection, validate(checkoutSchema), subscriptionsController.checkout);
router.post('/verify', requireRole('COACH'), csrfProtection, validate(verifyPaymentSchema), subscriptionsController.verify);
router.post('/downgrade', requireRole('COACH'), csrfProtection, subscriptionsController.downgrade);

export default router;
