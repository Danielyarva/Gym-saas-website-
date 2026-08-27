import { apiRequest } from './api-client';
import type { NutritionPlanSummary, NutritionPlanDetail, NutritionMealDetail, NutritionFoodDetail, NutritionPlanStatus, MealType } from '@/types';

export interface CreateNutritionPlanInput {
  name: string;
  dailyWaterTargetMl?: number;
  notes?: string;
}

export interface UpdateNutritionPlanInput {
  name?: string;
  status?: NutritionPlanStatus;
  dailyWaterTargetMl?: number;
  notes?: string;
}

export interface NutritionMealInput {
  type: MealType;
  name?: string;
}

export interface NutritionFoodInput {
  name: string;
  quantity: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

const base = (clientId: string) => `/api/clients/${clientId}/nutrition-plans`;

export const nutritionPlansService = {
  list(clientId: string) {
    return apiRequest<NutritionPlanSummary[]>(base(clientId));
  },

  getById(clientId: string, planId: string) {
    return apiRequest<NutritionPlanDetail>(`${base(clientId)}/${planId}`);
  },

  getActive(clientId: string) {
    return apiRequest<NutritionPlanDetail>(`/api/clients/${clientId}/nutrition-plan/active`);
  },

  create(clientId: string, input: CreateNutritionPlanInput) {
    return apiRequest<NutritionPlanDetail>(base(clientId), { method: 'POST', body: input });
  },

  update(clientId: string, planId: string, input: UpdateNutritionPlanInput) {
    return apiRequest<NutritionPlanDetail>(`${base(clientId)}/${planId}`, { method: 'PATCH', body: input });
  },

  remove(clientId: string, planId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}`, { method: 'DELETE' });
  },

  duplicate(clientId: string, planId: string) {
    return apiRequest<NutritionPlanDetail>(`${base(clientId)}/${planId}/duplicate`, { method: 'POST' });
  },

  createMeal(clientId: string, planId: string, input: NutritionMealInput) {
    return apiRequest<NutritionMealDetail>(`${base(clientId)}/${planId}/meals`, { method: 'POST', body: input });
  },

  updateMeal(clientId: string, planId: string, mealId: string, input: Partial<NutritionMealInput>) {
    return apiRequest<NutritionMealDetail>(`${base(clientId)}/${planId}/meals/${mealId}`, { method: 'PATCH', body: input });
  },

  deleteMeal(clientId: string, planId: string, mealId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}/meals/${mealId}`, { method: 'DELETE' });
  },

  reorderMeals(clientId: string, planId: string, orderedIds: string[]) {
    return apiRequest<null>(`${base(clientId)}/${planId}/meals/reorder`, { method: 'PATCH', body: { orderedIds } });
  },

  createFood(clientId: string, planId: string, mealId: string, input: NutritionFoodInput) {
    return apiRequest<NutritionFoodDetail>(`${base(clientId)}/${planId}/meals/${mealId}/foods`, { method: 'POST', body: input });
  },

  updateFood(clientId: string, planId: string, mealId: string, foodId: string, input: Partial<NutritionFoodInput>) {
    return apiRequest<NutritionFoodDetail>(`${base(clientId)}/${planId}/meals/${mealId}/foods/${foodId}`, { method: 'PATCH', body: input });
  },

  deleteFood(clientId: string, planId: string, mealId: string, foodId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}/meals/${mealId}/foods/${foodId}`, { method: 'DELETE' });
  },

  reorderFoods(clientId: string, planId: string, mealId: string, orderedIds: string[]) {
    return apiRequest<null>(`${base(clientId)}/${planId}/meals/${mealId}/foods/reorder`, { method: 'PATCH', body: { orderedIds } });
  },
};
