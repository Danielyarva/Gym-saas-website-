import type { Request, Response } from 'express';
import { messageService } from '../services/message.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await messageService.listConversationsForCoach(req.user!.coachId!);
  sendSuccess(res, data);
});
