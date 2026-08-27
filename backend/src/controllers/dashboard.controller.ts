import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getDashboard(req.user!.coachId!);
  sendSuccess(res, data);
});
