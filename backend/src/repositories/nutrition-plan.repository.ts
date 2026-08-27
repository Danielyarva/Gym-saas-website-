import type { NutritionPlanStatus, MealType } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface NutritionPlanInput {
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

const planWithMealsInclude = {
  meals: {
    orderBy: { order: 'asc' as const },
    include: { foods: { orderBy: { order: 'asc' as const } } },
  },
};

export const nutritionPlanRepository = {
  listForClient(clientId: string) {
    return prisma.nutritionPlan.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  },

  findById(clientId: string, planId: string) {
    return prisma.nutritionPlan.findFirst({ where: { id: planId, clientId }, include: planWithMealsInclude });
  },

  findActiveForClient(clientId: string) {
    return prisma.nutritionPlan.findFirst({ where: { clientId, status: 'ACTIVE' }, include: planWithMealsInclude });
  },

  create(coachId: string, clientId: string, input: NutritionPlanInput) {
    return prisma.nutritionPlan.create({ data: { coachId, clientId, ...input } });
  },

  /** Activating a plan archives whatever else was ACTIVE for this client — same app-level invariant as workout plans. */
  async update(clientId: string, planId: string, input: UpdateNutritionPlanInput) {
    const existing = await prisma.nutritionPlan.findFirst({ where: { id: planId, clientId } });
    if (!existing) return null;

    if (input.status === 'ACTIVE') {
      return prisma.$transaction(async (tx) => {
        await tx.nutritionPlan.updateMany({ where: { clientId, status: 'ACTIVE', id: { not: planId } }, data: { status: 'ARCHIVED' } });
        return tx.nutritionPlan.update({ where: { id: planId }, data: input, include: planWithMealsInclude });
      });
    }

    return prisma.nutritionPlan.update({ where: { id: planId }, data: input, include: planWithMealsInclude });
  },

  async delete(clientId: string, planId: string) {
    const existing = await prisma.nutritionPlan.findFirst({ where: { id: planId, clientId } });
    if (!existing) return null;
    if (existing.status !== 'DRAFT') return 'NOT_DRAFT' as const;
    await prisma.nutritionPlan.delete({ where: { id: planId } });
    return existing;
  },

  async duplicate(clientId: string, planId: string) {
    const original = await prisma.nutritionPlan.findFirst({ where: { id: planId, clientId }, include: planWithMealsInclude });
    if (!original) return null;

    return prisma.nutritionPlan.create({
      data: {
        coachId: original.coachId,
        clientId: original.clientId,
        name: `${original.name} (copy)`,
        status: 'DRAFT',
        dailyWaterTargetMl: original.dailyWaterTargetMl,
        notes: original.notes,
        meals: {
          create: original.meals.map((meal) => ({
            type: meal.type,
            order: meal.order,
            name: meal.name,
            foods: {
              create: meal.foods.map((food) => ({
                name: food.name,
                quantity: food.quantity,
                calories: food.calories,
                proteinG: food.proteinG,
                carbsG: food.carbsG,
                fatG: food.fatG,
                fiberG: food.fiberG,
                order: food.order,
              })),
            },
          })),
        },
      },
      include: planWithMealsInclude,
    });
  },
};

export const nutritionMealRepository = {
  /** Includes the parent plan so services can verify (planId, clientId) match before allowing any write. */
  findById(mealId: string) {
    return prisma.nutritionMeal.findUnique({ where: { id: mealId }, include: { nutritionPlan: true } });
  },

  async create(planId: string, input: NutritionMealInput) {
    const count = await prisma.nutritionMeal.count({ where: { nutritionPlanId: planId } });
    return prisma.nutritionMeal.create({ data: { nutritionPlanId: planId, order: count + 1, ...input } });
  },

  update(mealId: string, input: Partial<NutritionMealInput>) {
    return prisma.nutritionMeal.update({ where: { id: mealId }, data: input });
  },

  delete(mealId: string) {
    return prisma.nutritionMeal.delete({ where: { id: mealId } });
  },

  reorder(orderedMealIds: string[]) {
    return prisma.$transaction(orderedMealIds.map((id, index) => prisma.nutritionMeal.update({ where: { id }, data: { order: index + 1 } })));
  },
};

export const nutritionFoodRepository = {
  findById(foodId: string) {
    return prisma.nutritionFood.findUnique({
      where: { id: foodId },
      include: { nutritionMeal: { include: { nutritionPlan: true } } },
    });
  },

  async create(mealId: string, input: NutritionFoodInput) {
    const count = await prisma.nutritionFood.count({ where: { nutritionMealId: mealId } });
    return prisma.nutritionFood.create({ data: { nutritionMealId: mealId, order: count + 1, ...input } });
  },

  update(foodId: string, input: Partial<NutritionFoodInput>) {
    return prisma.nutritionFood.update({ where: { id: foodId }, data: input });
  },

  delete(foodId: string) {
    return prisma.nutritionFood.delete({ where: { id: foodId } });
  },

  reorder(orderedFoodIds: string[]) {
    return prisma.$transaction(orderedFoodIds.map((id, index) => prisma.nutritionFood.update({ where: { id }, data: { order: index + 1 } })));
  },
};
