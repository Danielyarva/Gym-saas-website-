import { Router } from 'express';
import * as workoutLogController from '../controllers/workout-log.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnership, requireClientOwnershipOrSelf, requireSelf } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { workoutExerciseIdOnlyParamSchema, markExerciseLogSchema, listWorkoutLogsQuerySchema } from '../schemas/workout-plan.schema';

// mergeParams: true — mounted at '/:id/workout' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.get('/today', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), workoutLogController.getToday);

router.patch(
  '/today/exercises/:workoutExerciseId',
  requireRole('CLIENT'),
  csrfProtection,
  validate(workoutExerciseIdOnlyParamSchema, 'params'),
  requireSelf('id'),
  validate(markExerciseLogSchema),
  workoutLogController.markExercise,
);

router.post(
  '/today/complete',
  requireRole('CLIENT'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireSelf('id'),
  workoutLogController.completeToday,
);

router.get(
  '/logs',
  requireRole('COACH'),
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(listWorkoutLogsQuerySchema, 'query'),
  workoutLogController.list,
);

export default router;
