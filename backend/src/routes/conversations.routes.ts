import { Router } from 'express';
import * as conversationsController from '../controllers/conversations.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';

// Flat/top-level per PRD — the coach's cross-client inbox, mirroring /api/reports.
// A client never needs this: they only ever have one coach, so their inbox is just their one thread.
const router = Router();

router.use(authenticate);

router.get('/', requireRole('COACH'), conversationsController.list);

export default router;
