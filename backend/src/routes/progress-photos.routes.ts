import { Router } from 'express';
import * as progressPhotosController from '../controllers/progress-photos.controller';
import { requireRole } from '../middleware/require-role';
import { requireClientOwnershipOrSelf, requireSelf } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uploadSingleImage } from '../middleware/upload';
import { uuidParamSchema } from '../schemas/common.schema';
import { uploadPhotoBodySchema, listProgressPhotosQuerySchema, photoIdParamSchema } from '../schemas/progress-photo.schema';

// mergeParams: true — mounted at '/:id/progress-photos' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(listProgressPhotosQuerySchema, 'query'), progressPhotosController.list);

router.post(
  '/',
  requireRole('CLIENT'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireSelf('id'),
  uploadSingleImage('photo'),
  validate(uploadPhotoBodySchema),
  progressPhotosController.upload,
);

router.delete(
  '/:photoId',
  requireRole('CLIENT'),
  csrfProtection,
  validate(photoIdParamSchema, 'params'),
  requireSelf('id'),
  progressPhotosController.remove,
);

export default router;
