import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await notificationService.list(req.user!.id, page, pageSize);
  sendSuccess(res, data);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markRead(req.params.id!, req.user!.id);
  sendSuccess(res, null);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllRead(req.user!.id);
  sendSuccess(res, null);
});
