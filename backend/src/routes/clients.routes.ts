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

const router = Router();

router.use(authenticate, requireRole('COACH'));

router.get('/', validate(listClientsQuerySchema, 'query'), clientsController.list);
router.post('/', csrfProtection, validate(createClientSchema), clientsController.create);

router.get('/:id', validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.getById);
router.patch('/:id', csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, validate(updateClientSchema), clientsController.update);
router.delete('/:id', csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.archive);
router.post('/:id/unarchive', csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, clientsController.unarchive);

router.get('/:id/notes', validate(uuidParamSchema, 'params'), requireClientOwnership, notesController.list);
router.post('/:id/notes', csrfProtection, validate(uuidParamSchema, 'params'), requireClientOwnership, validate(createNoteSchema), notesController.create);
router.patch(
  '/:id/notes/:noteId',
  csrfProtection,
  validate(uuidNestedParamSchema, 'params'),
  requireClientOwnership,
  validate(updateNoteSchema),
  notesController.update,
);
router.delete('/:id/notes/:noteId', csrfProtection, validate(uuidNestedParamSchema, 'params'), requireClientOwnership, notesController.remove);

export default router;
