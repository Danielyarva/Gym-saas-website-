import type { Request, Response } from 'express';
import { workoutLogService } from '../services/workout-log.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const getToday = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutLogService.getToday(req.params.id!);
  sendSuccess(res, data);
});

export const markExercise = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutLogService.markExerciseComplete(req.params.id!, req.params.workoutExerciseId!, req.body);
  sendSuccess(res, data, 'Progress saved');
});

export const completeToday = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutLogService.completeWorkout(req.params.id!);
  sendSuccess(res, data, 'Workout complete');
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
  const data = await workoutLogService.listLogs(req.params.id!, page, pageSize);
  sendSuccess(res, data);
});
