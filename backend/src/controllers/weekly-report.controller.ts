import type { Request, Response } from 'express';
import { weeklyReportService } from '../services/weekly-report.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const { weekStart } = req.body as { weekStart?: Date };
  const data = await weeklyReportService.generate(req.params.id!, weekStart, req);
  sendSuccess(res, data, 'Weekly report generated', 201);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await weeklyReportService.list(req.params.id!, page, pageSize);
  sendSuccess(res, data);
});
