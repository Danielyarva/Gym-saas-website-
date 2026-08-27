import { Router } from 'express';
import * as checkinsController from '../controllers/checkins.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnershipOrSelf, requireSelf } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { submitCheckInSchema, listCheckInsQuerySchema } from '../schemas/checkin.schema';

// mergeParams: true — mounted at '/:id/checkins' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.post(
  '/',
  requireRole('CLIENT'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireSelf('id'),
  validate(submitCheckInSchema),
  checkinsController.submit,
);

router.get('/today', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), checkinsController.getToday);

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(listCheckInsQuerySchema, 'query'), checkinsController.list);

export default router;
