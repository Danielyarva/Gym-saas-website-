import { z } from 'zod';

export const nutritionPlanStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);
export const mealTypeEnum = z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']);

export const nutritionPlanIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
});

export const mealIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  mealId: z.string().uuid(),
});

export const foodIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  mealId: z.string().uuid(),
  foodId: z.string().uuid(),
});

export const createNutritionPlanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  dailyWaterTargetMl: z.coerce.number().int().positive().max(20000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateNutritionPlanSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  status: nutritionPlanStatusEnum.optional(),
  dailyWaterTargetMl: z.coerce.number().int().positive().max(20000).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createMealSchema = z.object({
  type: mealTypeEnum,
  name: z.string().trim().max(60).optional(),
});

export const updateMealSchema = createMealSchema.partial();

export const createFoodSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().min(1).max(40),
  calories: z.coerce.number().int().min(0).max(10000),
  proteinG: z.coerce.number().min(0).max(1000),
  carbsG: z.coerce.number().min(0).max(1000),
  fatG: z.coerce.number().min(0).max(1000),
  fiberG: z.coerce.number().min(0).max(1000),
});

export const updateFoodSchema = createFoodSchema.partial();
