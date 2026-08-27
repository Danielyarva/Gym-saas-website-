import type { Request, Response } from 'express';
import { workoutPlanService } from '../services/workout-plan.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.list(req.params.id!);
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.getById(req.params.id!, req.params.planId!);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.create(req.user!.coachId!, req.params.id!, req.body);
  sendSuccess(res, data, 'Workout plan created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.update(req.params.id!, req.params.planId!, req.body, req);
  sendSuccess(res, data, 'Workout plan updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await workoutPlanService.remove(req.params.id!, req.params.planId!);
  sendSuccess(res, null, 'Workout plan deleted');
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.duplicate(req.params.id!, req.params.planId!);
  sendSuccess(res, data, 'Workout plan duplicated', 201);
});

export const createDay = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.createDay(req.params.id!, req.params.planId!, req.body);
  sendSuccess(res, data, 'Day added', 201);
});

export const updateDay = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.updateDay(req.params.id!, req.params.planId!, req.params.dayId!, req.body);
  sendSuccess(res, data, 'Day updated');
});

export const deleteDay = asyncHandler(async (req: Request, res: Response) => {
  await workoutPlanService.deleteDay(req.params.id!, req.params.planId!, req.params.dayId!);
  sendSuccess(res, null, 'Day deleted');
});

export const reorderDays = asyncHandler(async (req: Request, res: Response) => {
  await workoutPlanService.reorderDays(req.params.id!, req.params.planId!, req.body.orderedIds);
  sendSuccess(res, null, 'Days reordered');
});

export const createExercise = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.createExercise(req.params.id!, req.params.planId!, req.params.dayId!, req.body);
  sendSuccess(res, data, 'Exercise added', 201);
});

export const updateExercise = asyncHandler(async (req: Request, res: Response) => {
  const data = await workoutPlanService.updateExercise(
    req.params.id!,
    req.params.planId!,
    req.params.dayId!,
    req.params.workoutExerciseId!,
    req.body,
  );
  sendSuccess(res, data, 'Exercise updated');
});

export const deleteExercise = asyncHandler(async (req: Request, res: Response) => {
  await workoutPlanService.deleteExercise(req.params.id!, req.params.planId!, req.params.dayId!, req.params.workoutExerciseId!);
  sendSuccess(res, null, 'Exercise removed');
});

export const reorderExercises = asyncHandler(async (req: Request, res: Response) => {
  await workoutPlanService.reorderExercises(req.params.id!, req.params.planId!, req.params.dayId!, req.body.orderedIds);
  sendSuccess(res, null, 'Exercises reordered');
});
