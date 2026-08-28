import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { listNotificationsQuerySchema } from '../schemas/notification.schema';

// Flat/top-level, any authenticated role — self-scoped by req.user.id, not client ownership.
const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsQuerySchema, 'query'), notificationsController.list);
router.patch('/:id/read', csrfProtection, validate(uuidParamSchema, 'params'), notificationsController.markRead);
router.post('/read-all', csrfProtection, notificationsController.markAllRead);

export default router;
