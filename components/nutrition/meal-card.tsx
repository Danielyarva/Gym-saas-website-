'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MealFormDialog } from './meal-form-dialog';
import { FoodFormDialog } from './food-form-dialog';
import { FoodRow } from './food-row';
import { useDeleteNutritionMeal, useDeleteNutritionFood, useReorderNutritionFoods } from '@/hooks/use-nutrition-plans';
import { ApiError } from '@/services/api-client';
import type { NutritionMealDetail, NutritionFoodDetail } from '@/types';

const MEAL_TYPE_LABELS: Record<string, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner', SNACK: 'Snack' };

interface MealCardProps {
  clientId: string;
  planId: string;
  meal: NutritionMealDetail;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function MealCard({ clientId, planId, meal, isFirst, isLast, onMoveUp, onMoveDown }: MealCardProps) {
  const [editMealOpen, setEditMealOpen] = useState(false);
  const [deleteMealOpen, setDeleteMealOpen] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<NutritionFoodDetail | undefined>();
  const [deletingFood, setDeletingFood] = useState<NutritionFoodDetail | undefined>();

  const deleteMeal = useDeleteNutritionMeal(clientId, planId);
  const deleteFood = useDeleteNutritionFood(clientId, planId);
  const reorderFoods = useReorderNutritionFoods(clientId, planId);

  function moveFood(index: number, direction: -1 | 1) {
    const ids = meal.foods.map((f) => f.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    [ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!];
    reorderFoods.mutate({ mealId: meal.id, orderedIds: ids });
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{meal.name || MEAL_TYPE_LABELS[meal.type]}</p>
          <Badge variant="secondary">{MEAL_TYPE_LABELS[meal.type]}</Badge>
          <span className="text-xs text-muted-foreground">{Math.round(meal.totals.calories)} kcal</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" disabled={isFirst} onClick={onMoveUp} aria-label="Move meal up">
            <ArrowUp />
          </Button>
          <Button variant="ghost" size="icon" disabled={isLast} onClick={onMoveDown} aria-label="Move meal down">
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setEditMealOpen(true)} aria-label="Edit meal">
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteMealOpen(true)} aria-label="Delete meal">
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {meal.foods.map((food, index) => (
          <FoodRow
            key={food.id}
            food={food}
            isFirst={index === 0}
            isLast={index === meal.foods.length - 1}
            onMoveUp={() => moveFood(index, -1)}
            onMoveDown={() => moveFood(index, 1)}
            onEdit={() => setEditingFood(food)}
            onDelete={() => setDeletingFood(food)}
          />
        ))}

        <Button variant="outline" size="sm" onClick={() => setAddFoodOpen(true)}>
          <Plus /> Add food
        </Button>
      </div>

      <MealFormDialog open={editMealOpen} onOpenChange={setEditMealOpen} clientId={clientId} planId={planId} meal={meal} />

      <ConfirmDialog
        open={deleteMealOpen}
        onOpenChange={setDeleteMealOpen}
        title={`Delete this meal?`}
        description="This removes the meal and every food in it. This can't be undone."
        confirmLabel="Delete"
        destructive
        isPending={deleteMeal.isPending}
        onConfirm={() =>
          deleteMeal.mutate(meal.id, {
            onSuccess: () => {
              toast.success('Meal deleted');
              setDeleteMealOpen(false);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
          })
        }
      />

      <FoodFormDialog open={addFoodOpen} onOpenChange={setAddFoodOpen} clientId={clientId} planId={planId} mealId={meal.id} />

      {editingFood ? (
        <FoodFormDialog
          open={Boolean(editingFood)}
          onOpenChange={(next) => !next && setEditingFood(undefined)}
          clientId={clientId}
          planId={planId}
          mealId={meal.id}
          existing={editingFood}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingFood)}
        onOpenChange={(next) => !next && setDeletingFood(undefined)}
        title={`Remove "${deletingFood?.name}"?`}
        description="This removes the food from this meal."
        confirmLabel="Remove"
        destructive
        isPending={deleteFood.isPending}
        onConfirm={() => {
          if (!deletingFood) return;
          deleteFood.mutate(
            { mealId: meal.id, foodId: deletingFood.id },
            {
              onSuccess: () => {
                toast.success('Food removed');
                setDeletingFood(undefined);
              },
              onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
            },
          );
        }}
      />
    </div>
  );
}
