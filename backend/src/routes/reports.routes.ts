import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { validate } from '../middleware/validate';
import { listWeeklyReportsQuerySchema } from '../schemas/weekly-report.schema';

// Flat/top-level per PRD — genuinely cross-client (a coach's own reports across their whole roster).
const router = Router();

router.use(authenticate);

router.get('/', requireRole('COACH'), validate(listWeeklyReportsQuerySchema, 'query'), reportsController.list);

export default router;
