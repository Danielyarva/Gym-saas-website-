import type { Request, Response } from 'express';
import { aiChatService } from '../services/ai-chat.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { content } = req.body as { content: string };
  const data = await aiChatService.sendMessage(req.params.id!, content, req);
  sendSuccess(res, data, 'Message sent', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await aiChatService.listMessages(req.params.id!, page, pageSize);
  sendSuccess(res, data);
});
