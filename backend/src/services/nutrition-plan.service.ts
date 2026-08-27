import type { Request } from 'express';
import {
  nutritionPlanRepository,
  nutritionMealRepository,
  nutritionFoodRepository,
  type NutritionPlanInput,
  type UpdateNutritionPlanInput,
  type NutritionMealInput,
  type NutritionFoodInput,
} from '../repositories/nutrition-plan.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';

function toNumber(value: unknown): number {
  return Number(value);
}

function toPublicFood(food: { id: string; order: number; name: string; quantity: string; calories: number; proteinG: unknown; carbsG: unknown; fatG: unknown; fiberG: unknown }) {
  return {
    id: food.id,
    order: food.order,
    name: food.name,
    quantity: food.quantity,
    calories: food.calories,
    proteinG: toNumber(food.proteinG),
    carbsG: toNumber(food.carbsG),
    fatG: toNumber(food.fatG),
    fiberG: toNumber(food.fiberG),
  };
}

function totalsFor(foods: ReturnType<typeof toPublicFood>[]) {
  return foods.reduce(
    (totals, food) => ({
      calories: totals.calories + food.calories,
      proteinG: totals.proteinG + food.proteinG,
      carbsG: totals.carbsG + food.carbsG,
      fatG: totals.fatG + food.fatG,
      fiberG: totals.fiberG + food.fiberG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
}

function toPublicMeal(meal: { id: string; type: string; order: number; name: string | null; foods: Parameters<typeof toPublicFood>[0][] }) {
  const foods = meal.foods.map(toPublicFood);
  return { id: meal.id, type: meal.type, order: meal.order, name: meal.name, foods, totals: totalsFor(foods) };
}

function toPublicPlan(plan: {
  id: string;
  name: string;
  status: string;
  dailyWaterTargetMl: number | null;
  notes: string | null;
  createdAt: Date;
  meals: Parameters<typeof toPublicMeal>[0][];
}) {
  const meals = plan.meals.map(toPublicMeal);
  const dailyTotals = totalsFor(meals.flatMap((meal) => meal.foods));
  return {
    id: plan.id,
    name: plan.name,
    status: plan.status,
    dailyWaterTargetMl: plan.dailyWaterTargetMl,
    notes: plan.notes,
    createdAt: plan.createdAt,
    meals,
    dailyTotals,
  };
}

async function list(clientId: string) {
  return nutritionPlanRepository.listForClient(clientId);
}

async function getById(clientId: string, planId: string) {
  const plan = await nutritionPlanRepository.findById(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Nutrition plan not found');
  return toPublicPlan(plan);
}

async function getActivePlan(clientId: string) {
  const plan = await nutritionPlanRepository.findActiveForClient(clientId);
  if (!plan) throw new AppError('PLAN_NOT_ACTIVE', 'No active nutrition plan');
  return toPublicPlan(plan);
}

async function create(coachId: string, clientId: string, input: NutritionPlanInput) {
  const plan = await nutritionPlanRepository.create(coachId, clientId, input);
  return getById(clientId, plan.id);
}

async function update(clientId: string, planId: string, input: UpdateNutritionPlanInput, req: Request) {
  const result = await nutritionPlanRepository.update(clientId, planId, input);
  if (!result) throw new AppError('NOT_FOUND', 'Nutrition plan not found');

  if (input.status === 'ACTIVE') {
    await auditService.log({ req, actorUserId: req.user?.id, action: 'NUTRITION_PLAN_ASSIGNED', entityType: 'CLIENT', entityId: clientId, metadata: { planId } });
  }

  return toPublicPlan(result);
}

async function remove(clientId: string, planId: string) {
  const result = await nutritionPlanRepository.delete(clientId, planId);
  if (result === null) throw new AppError('NOT_FOUND', 'Nutrition plan not found');
  if (result === 'NOT_DRAFT') throw new AppError('VALIDATION_ERROR', 'Only draft plans can be deleted — archive it instead');
}

async function duplicate(clientId: string, planId: string) {
  const plan = await nutritionPlanRepository.duplicate(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Nutrition plan not found');
  return toPublicPlan(plan);
}

async function assertPlanBelongsToClient(clientId: string, planId: string) {
  const plan = await nutritionPlanRepository.findById(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Nutrition plan not found');
  return plan;
}

async function assertMealBelongsToPlan(clientId: string, planId: string, mealId: string) {
  const meal = await nutritionMealRepository.findById(mealId);
  if (!meal || meal.nutritionPlan.clientId !== clientId || meal.nutritionPlanId !== planId) {
    throw new AppError('NOT_FOUND', 'Meal not found');
  }
  return meal;
}

async function assertFoodBelongsToChain(clientId: string, planId: string, mealId: string, foodId: string) {
  const food = await nutritionFoodRepository.findById(foodId);
  if (!food || food.nutritionMeal.nutritionPlan.clientId !== clientId || food.nutritionMeal.nutritionPlanId !== planId || food.nutritionMealId !== mealId) {
    throw new AppError('NOT_FOUND', 'Food not found in this meal');
  }
  return food;
}

async function createMeal(clientId: string, planId: string, input: NutritionMealInput) {
  await assertPlanBelongsToClient(clientId, planId);
  return nutritionMealRepository.create(planId, input);
}

async function updateMeal(clientId: string, planId: string, mealId: string, input: Partial<NutritionMealInput>) {
  await assertMealBelongsToPlan(clientId, planId, mealId);
  return nutritionMealRepository.update(mealId, input);
}

async function deleteMeal(clientId: string, planId: string, mealId: string) {
  await assertMealBelongsToPlan(clientId, planId, mealId);
  await nutritionMealRepository.delete(mealId);
}

async function reorderMeals(clientId: string, planId: string, orderedMealIds: string[]) {
  await Promise.all(orderedMealIds.map((mealId) => assertMealBelongsToPlan(clientId, planId, mealId)));
  await nutritionMealRepository.reorder(orderedMealIds);
}

async function createFood(clientId: string, planId: string, mealId: string, input: NutritionFoodInput) {
  await assertMealBelongsToPlan(clientId, planId, mealId);
  return nutritionFoodRepository.create(mealId, input);
}

async function updateFood(clientId: string, planId: string, mealId: string, foodId: string, input: Partial<NutritionFoodInput>) {
  await assertFoodBelongsToChain(clientId, planId, mealId, foodId);
  return nutritionFoodRepository.update(foodId, input);
}

async function deleteFood(clientId: string, planId: string, mealId: string, foodId: string) {
  await assertFoodBelongsToChain(clientId, planId, mealId, foodId);
  await nutritionFoodRepository.delete(foodId);
}

async function reorderFoods(clientId: string, planId: string, mealId: string, orderedFoodIds: string[]) {
  await Promise.all(orderedFoodIds.map((foodId) => assertFoodBelongsToChain(clientId, planId, mealId, foodId)));
  await nutritionFoodRepository.reorder(orderedFoodIds);
}

export const nutritionPlanService = {
  list,
  getById,
  getActivePlan,
  create,
  update,
  remove,
  duplicate,
  createMeal,
  updateMeal,
  deleteMeal,
  reorderMeals,
  createFood,
  updateFood,
  deleteFood,
  reorderFoods,
};
