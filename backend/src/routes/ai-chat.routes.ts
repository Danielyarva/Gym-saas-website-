import { Router } from 'express';
import * as aiChatController from '../controllers/ai-chat.controller';
import { requireClientOwnershipOrSelf, requireSelf } from '../middleware/require-client-ownership';
import { requireRole } from '../middleware/require-role';
import { csrfProtection } from '../middleware/csrf';
import { validate } from '../middleware/validate';
import { uuidParamSchema } from '../schemas/common.schema';
import { sendChatMessageSchema, listChatMessagesQuerySchema } from '../schemas/ai-chat.schema';

// mergeParams: true — mounted at '/:id/ai/chat' inside clients.routes.ts.
const router = Router({ mergeParams: true });

router.post(
  '/',
  requireRole('CLIENT'),
  csrfProtection,
  validate(uuidParamSchema, 'params'),
  requireSelf('id'),
  validate(sendChatMessageSchema),
  aiChatController.sendMessage,
);

router.get('/', validate(uuidParamSchema, 'params'), requireClientOwnershipOrSelf(), validate(listChatMessagesQuerySchema, 'query'), aiChatController.list);

export default router;
