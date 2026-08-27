import { Router } from 'express';
import * as workoutPlansController from '../controllers/workout-plans.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnership } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import {
  planIdParamSchema,
  dayIdParamSchema,
  workoutExerciseIdParamSchema,
  createWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  createWorkoutDaySchema,
  updateWorkoutDaySchema,
  reorderIdsSchema,
  createWorkoutExerciseSchema,
  updateWorkoutExerciseSchema,
} from '../schemas/workout-plan.schema';

// mergeParams: true — mounted at '/:id/workout-plans' inside clients.routes.ts,
// so req.params.id (the client id) comes from the parent. Coach-only:
// building a client's plan structure is never something the client does.
// requireClientOwnership runs on every route (right after params validation,
// since it needs req.params.id) — the same middleware-layer backstop every
// other client-scoped resource uses, checked here regardless of how deeply
// nested the resource (day/exercise) is.
const router = Router({ mergeParams: true });

router.use(requireRole('COACH'));

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnership, workoutPlansController.list);
router.post(
  '/',
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(createWorkoutPlanSchema),
  workoutPlansController.create,
);

router.get('/:planId', validate(planIdParamSchema, 'params'), requireClientOwnership, workoutPlansController.getById);
router.patch(
  '/:planId',
  csrfProtection,
  validate(planIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateWorkoutPlanSchema),
  workoutPlansController.update,
);
router.delete('/:planId', csrfProtection, validate(planIdParamSchema, 'params'), requireClientOwnership, workoutPlansController.remove);
router.post(
  '/:planId/duplicate',
  csrfProtection,
  validate(planIdParamSchema, 'params'),
  requireClientOwnership,
  workoutPlansController.duplicate,
);

router.post(
  '/:planId/days',
  csrfProtection,
  validate(planIdParamSchema, 'params'),
  requireClientOwnership,
  validate(createWorkoutDaySchema),
  workoutPlansController.createDay,
);
router.patch(
  '/:planId/days/reorder',
  csrfProtection,
  validate(planIdParamSchema, 'params'),
  requireClientOwnership,
  validate(reorderIdsSchema),
  workoutPlansController.reorderDays,
);
router.patch(
  '/:planId/days/:dayId',
  csrfProtection,
  validate(dayIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateWorkoutDaySchema),
  workoutPlansController.updateDay,
);
router.delete(
  '/:planId/days/:dayId',
  csrfProtection,
  validate(dayIdParamSchema, 'params'),
  requireClientOwnership,
  workoutPlansController.deleteDay,
);

router.post(
  '/:planId/days/:dayId/exercises',
  csrfProtection,
  validate(dayIdParamSchema, 'params'),
  requireClientOwnership,
  validate(createWorkoutExerciseSchema),
  workoutPlansController.createExercise,
);
router.patch(
  '/:planId/days/:dayId/exercises/reorder',
  csrfProtection,
  validate(dayIdParamSchema, 'params'),
  requireClientOwnership,
  validate(reorderIdsSchema),
  workoutPlansController.reorderExercises,
);
router.patch(
  '/:planId/days/:dayId/exercises/:workoutExerciseId',
  csrfProtection,
  validate(workoutExerciseIdParamSchema, 'params'),
  requireClientOwnership,
  validate(updateWorkoutExerciseSchema),
  workoutPlansController.updateExercise,
);
router.delete(
  '/:planId/days/:dayId/exercises/:workoutExerciseId',
  csrfProtection,
  validate(workoutExerciseIdParamSchema, 'params'),
  requireClientOwnership,
  workoutPlansController.deleteExercise,
);

export default router;
