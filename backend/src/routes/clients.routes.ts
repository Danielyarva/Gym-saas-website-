import { Router } from 'express';
import * as clientsController from '../controllers/clients.controller';
import * as notesController from '../controllers/notes.controller';
import { authenticate } from '../middleware/authenticate';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnership } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { listClientsQuerySchema, createClientSchema, updateClientSchema } from '../schemas/client.schema';
import { createNoteSchema, updateNoteSchema } from '../schemas/note.schema';
import { uuidParamSchema, uuidNestedParamSchema } from '../schemas/common.schema';
import onboardingRoutes from './onboarding.routes';
import workoutPlansRoutes from './workout-plans.routes';
import workoutRoutes from './workout.routes';

const router = Router();

// Phase 2 mounts mixed-role sub-resources (a client reading/writing their own
// workout/nutrition/check-in data) on this same router, so the gate can only
// authenticate here — each Phase 1 route below now states its own
// requireRole('COACH') explicitly, preserving identical behavior.
router.use(authenticate);

router.get('/', requireRole('COACH'), validate(listClientsQuerySchema, 'query'), clientsController.list);
router.post('/', requireRole('COACH'), csrfProtection, validate(createClientSchema), clientsController.create);

router.get('/:id', requireRole('COACH'), validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.getById);
router.patch(
  '/:id',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(updateClientSchema),
  clientsController.update,
);
router.delete('/:id', requireRole('COACH'), csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.archive);
router.post(
  '/:id/unarchive',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  clientsController.unarchive,
);
router.post('/:id/invite', requireRole('COACH'), csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.invite);

router.get('/:id/notes', requireRole('COACH'), validate(uuidParamSchema, 'params'), requireClientOwnership, notesController.list);
router.post(
  '/:id/notes',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireClientOwnership,
  validate(createNoteSchema),
  notesController.create,
);
router.patch(
  '/:id/notes/:noteId',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidNestedParamSchema, 'params'),
  requireClientOwnership,
  validate(updateNoteSchema),
  notesController.update,
);
router.delete(
  '/:id/notes/:noteId',
  requireRole('COACH'),
  csrfProtection,
  validate(uuidNestedParamSchema, 'params'),
  requireClientOwnership,
  notesController.remove,
);

router.use('/:id/onboarding', onboardingRoutes);
router.use('/:id/workout-plans', workoutPlansRoutes);
router.use('/:id/workout', workoutRoutes);

export default router;
