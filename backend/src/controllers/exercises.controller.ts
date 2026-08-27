import type { Request, Response } from 'express';
import { exerciseService } from '../services/exercise.service';
import type { ListExercisesFilters } from '../repositories/exercise.repository';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await exerciseService.list(req.user!.coachId!, req.query as unknown as ListExercisesFilters);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await exerciseService.create(req.user!.coachId!, req.body);
  sendSuccess(res, data, 'Exercise added', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await exerciseService.update(req.user!.coachId!, req.params.exerciseId!, req.body);
  sendSuccess(res, data, 'Exercise updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await exerciseService.remove(req.user!.coachId!, req.params.exerciseId!);
  sendSuccess(res, null, 'Exercise deleted');
});
