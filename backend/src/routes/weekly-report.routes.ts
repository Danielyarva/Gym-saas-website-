import { Router } from 'express';
import * as weeklyReportController from '../controllers/weekly-report.controller';
import { requireClientOwnership, requireClientOwnershipOrSelf } from '../middleware/require-client-ownership';
import { requireRole } from '../middleware/require-role';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { generateWeeklyReportSchema, listWeeklyReportsQuerySchema } from '../schemas/weekly-report.schema';

// mergeParams: true — mounted at '/:id/ai/weekly-report' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.post(
  '/',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(generateWeeklyReportSchema),
  weeklyReportController.generate,
);

router.get(
  '/',
  validate(uuidParamSchema, 'params'),
  requireClientOwnershipOrSelf(),
  validate(listWeeklyReportsQuerySchema, 'query'),
  weeklyReportController.list,
);

export default router;
