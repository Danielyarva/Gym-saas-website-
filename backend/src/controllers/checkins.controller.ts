import type { Request, Response } from 'express';
import { checkinService } from '../services/checkin.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const data = await checkinService.submit(req.params.id!, req.body, req);
  sendSuccess(res, data, 'Check-in submitted');
});

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const data = await checkinService.getToday(req.params.id!);
  sendSuccess(res, data);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await checkinService.list(req.params.id!, req.query as unknown as { from?: Date; to?: Date; page: number; pageSize: number });
  sendSuccess(res, data);
});
