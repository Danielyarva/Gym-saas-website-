import type { Request, Response } from 'express';
import type { MessageSenderRole } from '@prisma/client';
import { messageService } from '../services/message.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

/** ADMIN never reaches these handlers — requireClientOwnershipOrSelf() only ever grants COACH or CLIENT. */
function senderRole(req: Request): MessageSenderRole {
  return req.user!.role === 'COACH' ? 'COACH' : 'CLIENT';
}

export const send = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content?: string };
  const data = await messageService.send(req.params.id!, senderRole(req), content, req.file, req);
  sendSuccess(res, data, 'Message sent', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await messageService.list(req.params.id!, senderRole(req), page, pageSize);
  sendSuccess(res, data);
});

export const typing = asyncHandler(async (req: Request, res: Response) => {
  await messageService.setTyping(req.params.id!, senderRole(req));
  sendSuccess(res, null);
});
