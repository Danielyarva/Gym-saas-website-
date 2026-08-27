import { z } from 'zod';

function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), schema.optional());
}

export const mealTypeOptions = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;

export const createNutritionPlanFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a plan name').max(120),
  dailyWaterTargetMl: optionalNumber(z.coerce.number().int().positive().max(20000)),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});
export type CreateNutritionPlanFormValues = z.infer<typeof createNutritionPlanFormSchema>;

export const mealFormSchema = z.object({
  type: z.enum(mealTypeOptions),
  name: z.string().trim().max(60).optional().or(z.literal('')),
});
export type MealFormValues = z.infer<typeof mealFormSchema>;

export const foodFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a food name').max(120),
  quantity: z.string().trim().min(1, 'e.g. 150g, 1 cup').max(40),
  calories: z.coerce.number().int().min(0).max(10000),
  proteinG: z.coerce.number().min(0).max(1000),
  carbsG: z.coerce.number().min(0).max(1000),
  fatG: z.coerce.number().min(0).max(1000),
  fiberG: z.coerce.number().min(0).max(1000),
});
export type FoodFormValues = z.infer<typeof foodFormSchema>;
