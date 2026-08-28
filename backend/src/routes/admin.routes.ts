import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { validate } from '../middleware/validate';
import { listCoachesQuerySchema } from '../schemas/admin.schema';

// Platform-wide, ADMIN-only — every route here is unscoped by design (see admin-analytics.repository.ts's own comment).
const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/analytics', adminController.getAnalytics);
router.get('/coaches', validate(listCoachesQuerySchema, 'query'), adminController.listCoaches);

export default router;
