import type { Request, Response } from 'express';
import { aiInsightService } from '../services/ai-insight.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await aiInsightService.list(req.params.id!, page, pageSize);
  sendSuccess(res, data);
});
