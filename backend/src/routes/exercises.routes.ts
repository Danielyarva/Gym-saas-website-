import { Router } from 'express';
import * as exercisesController from '../controllers/exercises.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { listExercisesQuerySchema, createExerciseSchema, updateExerciseSchema, exerciseIdParamSchema } from '../schemas/exercise.schema';

const router = Router();

router.use(authenticate, requireRole('COACH'));

router.get('/', validate(listExercisesQuerySchema, 'query'), exercisesController.list);
router.post('/', csrfProtection, validate(createExerciseSchema), exercisesController.create);
router.patch('/:exerciseId', csrfProtection, validate(exerciseIdParamSchema, 'params'), validate(updateExerciseSchema), exercisesController.update);
router.delete('/:exerciseId', csrfProtection, validate(exerciseIdParamSchema, 'params'), exercisesController.remove);

export default router;
