import type { Request, Response } from 'express';
import { nutritionPlanService } from '../services/nutrition-plan.service';
import { asyncHandler } from '../utils/async-handler';
import { sendSuccess } from '../utils/response';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.list(req.params.id!);
  sendSuccess(res, data);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.getById(req.params.id!, req.params.planId!);
  sendSuccess(res, data);
});

export const getActive = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.getActivePlan(req.params.id!);
  sendSuccess(res, data);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.create(req.user!.coachId!, req.params.id!, req.body);
  sendSuccess(res, data, 'Nutrition plan created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.update(req.params.id!, req.params.planId!, req.body, req);
  sendSuccess(res, data, 'Nutrition plan updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await nutritionPlanService.remove(req.params.id!, req.params.planId!);
  sendSuccess(res, null, 'Nutrition plan deleted');
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.duplicate(req.params.id!, req.params.planId!);
  sendSuccess(res, data, 'Nutrition plan duplicated', 201);
});

export const createMeal = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.createMeal(req.params.id!, req.params.planId!, req.body);
  sendSuccess(res, data, 'Meal added', 201);
});

export const updateMeal = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.updateMeal(req.params.id!, req.params.planId!, req.params.mealId!, req.body);
  sendSuccess(res, data, 'Meal updated');
});

export const deleteMeal = asyncHandler(async (req: Request, res: Response) => {
  await nutritionPlanService.deleteMeal(req.params.id!, req.params.planId!, req.params.mealId!);
  sendSuccess(res, null, 'Meal deleted');
});

export const reorderMeals = asyncHandler(async (req: Request, res: Response) => {
  await nutritionPlanService.reorderMeals(req.params.id!, req.params.planId!, req.body.orderedIds);
  sendSuccess(res, null, 'Meals reordered');
});

export const createFood = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.createFood(req.params.id!, req.params.planId!, req.params.mealId!, req.body);
  sendSuccess(res, data, 'Food added', 201);
});

export const updateFood = asyncHandler(async (req: Request, res: Response) => {
  const data = await nutritionPlanService.updateFood(req.params.id!, req.params.planId!, req.params.mealId!, req.params.foodId!, req.body);
  sendSuccess(res, data, 'Food updated');
});

export const deleteFood = asyncHandler(async (req: Request, res: Response) => {
  await nutritionPlanService.deleteFood(req.params.id!, req.params.planId!, req.params.mealId!, req.params.foodId!);
  sendSuccess(res, null, 'Food removed');
});

export const reorderFoods = asyncHandler(async (req: Request, res: Response) => {
  await nutritionPlanService.reorderFoods(req.params.id!, req.params.planId!, req.params.mealId!, req.body.orderedIds);
  sendSuccess(res, null, 'Foods reordered');
});
