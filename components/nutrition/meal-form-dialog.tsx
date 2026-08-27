'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateNutritionMeal, useUpdateNutritionMeal } from '@/hooks/use-nutrition-plans';
import { mealFormSchema, mealTypeOptions, type MealFormValues } from '@/schemas/nutrition-plan.schema';
import { ApiError } from '@/services/api-client';
import type { NutritionMealDetail } from '@/types';

const MEAL_TYPE_LABELS: Record<(typeof mealTypeOptions)[number], string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};

interface MealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  planId: string;
  meal?: NutritionMealDetail;
}

export function MealFormDialog({ open, onOpenChange, clientId, planId, meal }: MealFormDialogProps) {
  const createMeal = useCreateNutritionMeal(clientId, planId);
  const updateMeal = useUpdateNutritionMeal(clientId, planId);
  const isEditing = Boolean(meal);
  const isPending = createMeal.isPending || updateMeal.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof mealFormSchema>, undefined, MealFormValues>({
    resolver: zodResolver(mealFormSchema),
    values: { type: meal?.type ?? 'BREAKFAST', name: meal?.name ?? '' },
  });

  const onSubmit = (values: MealFormValues) => {
    const input = { type: values.type, name: values.name || undefined };
    const onSuccess = () => {
      toast.success(isEditing ? 'Meal updated' : 'Meal added');
      reset();
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong');

    if (isEditing && meal) {
      updateMeal.mutate({ mealId: meal.id, input }, { onSuccess, onError });
    } else {
      createMeal.mutate(input, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit meal' : 'Add a meal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Meal type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {MEAL_TYPE_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type ? <p className="text-xs text-destructive">{errors.type.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-name">Label (optional — useful for repeated snacks)</Label>
            <Input id="meal-name" placeholder="e.g. Snack 1" {...register('name')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add meal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
