import type { Request, Response } from 'express';
import { adminAnalyticsService } from '../services/admin-analytics.service';
import { adminService } from '../services/admin.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminAnalyticsService.getAnalytics();
  sendSuccess(res, data);
});

export const listCoaches = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as unknown as { search?: string; page: number; pageSize: number };
  const data = await adminService.listCoaches(search, page, pageSize);
  sendSuccess(res, data);
});
