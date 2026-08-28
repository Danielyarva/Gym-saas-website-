import { Router } from 'express';
import * as messagesController from '../controllers/messages.controller';
import { requireClientOwnershipOrSelf } from '../middleware/require-client-ownership';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uploadOptionalImage } from '../middleware/upload';
import { uuidParamSchema } from '../schemas/common.schema';
import { sendMessageSchema, listMessagesQuerySchema } from '../schemas/message.schema';

// mergeParams: true — mounted at '/:id/messages' inside clients.routes.ts. Mixed role
// for both read and write: this is the first two-way resource in the app.
const router = Router({ mergeParams: true });

router.post(
  '/',
  validate(uuidParamSchema, 'params'),
  requireClientOwnershipOrSelf(),
  csrfProtection,
  uploadOptionalImage('attachment'),
  validate(sendMessageSchema),
  messagesController.send,
);

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(listMessagesQuerySchema, 'query'), messagesController.list);

router.post('/typing', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), csrfProtection, messagesController.typing);

export default router;
