import type { Request, Response } from 'express';
import { progressService } from '../services/progress.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getCharts = asyncHandler(async (req: Request, res: Response) => {
  const { range } = req.query as unknown as { range: string };
  const data = await progressService.getCharts(req.params.id!, range);
  sendSuccess(res, data);
});
