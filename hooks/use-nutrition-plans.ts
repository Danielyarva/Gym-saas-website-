import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  nutritionPlansService,
  type CreateNutritionPlanInput,
  type UpdateNutritionPlanInput,
  type NutritionMealInput,
  type NutritionFoodInput,
} from '@/services/nutrition-plans.service';
import { ApiError } from '@/services/api-client';

const keys = {
  list: (clientId: string) => ['nutrition-plans', 'list', clientId] as const,
  detail: (clientId: string, planId: string) => ['nutrition-plans', 'detail', clientId, planId] as const,
  active: (clientId: string) => ['nutrition-plans', 'active', clientId] as const,
};

export function useNutritionPlans(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => nutritionPlansService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useNutritionPlan(clientId: string, planId: string) {
  return useQuery({
    queryKey: keys.detail(clientId, planId),
    queryFn: () => nutritionPlansService.getById(clientId, planId),
    enabled: Boolean(clientId && planId),
  });
}

export function useActiveNutritionPlan(clientId: string) {
  return useQuery({
    queryKey: keys.active(clientId),
    queryFn: () => nutritionPlansService.getActive(clientId),
    enabled: Boolean(clientId),
    retry: (failureCount, error) => !(error instanceof ApiError && error.code === 'PLAN_NOT_ACTIVE') && failureCount < 2,
  });
}

export function useCreateNutritionPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNutritionPlanInput) => nutritionPlansService.create(clientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useUpdateNutritionPlan(clientId: string, planId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNutritionPlanInput) => nutritionPlansService.update(clientId, planId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.detail(clientId, planId), data);
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
      queryClient.invalidateQueries({ queryKey: keys.active(clientId) });
    },
  });
}

export function useDeleteNutritionPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => nutritionPlansService.remove(clientId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useDuplicateNutritionPlan(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => nutritionPlansService.duplicate(clientId, planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

function useInvalidatePlanDetail(clientId: string, planId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.detail(clientId, planId) });
    queryClient.invalidateQueries({ queryKey: keys.active(clientId) });
  };
}

export function useCreateNutritionMeal(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (input: NutritionMealInput) => nutritionPlansService.createMeal(clientId, planId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateNutritionMeal(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ mealId, input }: { mealId: string; input: Partial<NutritionMealInput> }) => nutritionPlansService.updateMeal(clientId, planId, mealId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNutritionMeal(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (mealId: string) => nutritionPlansService.deleteMeal(clientId, planId, mealId),
    onSuccess: invalidate,
  });
}

export function useReorderNutritionMeals(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: (orderedIds: string[]) => nutritionPlansService.reorderMeals(clientId, planId, orderedIds),
    onSuccess: invalidate,
  });
}

export function useCreateNutritionFood(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ mealId, input }: { mealId: string; input: NutritionFoodInput }) => nutritionPlansService.createFood(clientId, planId, mealId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateNutritionFood(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ mealId, foodId, input }: { mealId: string; foodId: string; input: Partial<NutritionFoodInput> }) =>
      nutritionPlansService.updateFood(clientId, planId, mealId, foodId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNutritionFood(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ mealId, foodId }: { mealId: string; foodId: string }) => nutritionPlansService.deleteFood(clientId, planId, mealId, foodId),
    onSuccess: invalidate,
  });
}

export function useReorderNutritionFoods(clientId: string, planId: string) {
  const invalidate = useInvalidatePlanDetail(clientId, planId);
  return useMutation({
    mutationFn: ({ mealId, orderedIds }: { mealId: string; orderedIds: string[] }) => nutritionPlansService.reorderFoods(clientId, planId, mealId, orderedIds),
    onSuccess: invalidate,
  });
}
