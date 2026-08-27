'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateNutritionFood, useUpdateNutritionFood } from '@/hooks/use-nutrition-plans';
import { foodFormSchema, type FoodFormValues } from '@/schemas/nutrition-plan.schema';
import { ApiError } from '@/services/api-client';
import type { NutritionFoodDetail } from '@/types';

interface FoodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  planId: string;
  mealId: string;
  existing?: NutritionFoodDetail;
}

export function FoodFormDialog({ open, onOpenChange, clientId, planId, mealId, existing }: FoodFormDialogProps) {
  const createFood = useCreateNutritionFood(clientId, planId);
  const updateFood = useUpdateNutritionFood(clientId, planId);
  const isEditing = Boolean(existing);
  const isPending = createFood.isPending || updateFood.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof foodFormSchema>, undefined, FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    values: {
      name: existing?.name ?? '',
      quantity: existing?.quantity ?? '',
      calories: existing?.calories ?? 0,
      proteinG: existing?.proteinG ?? 0,
      carbsG: existing?.carbsG ?? 0,
      fatG: existing?.fatG ?? 0,
      fiberG: existing?.fiberG ?? 0,
    },
  });

  const onSubmit = (values: FoodFormValues) => {
    const onSuccess = () => {
      toast.success(isEditing ? 'Food updated' : 'Food added');
      reset();
      onOpenChange(false);
    };
    const onError = (error: unknown) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong');

    if (isEditing && existing) {
      updateFood.mutate({ mealId, foodId: existing.id, input: values }, { onSuccess, onError });
    } else {
      createFood.mutate({ mealId, input: values }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit food' : 'Add a food'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="food-name">Name</Label>
              <Input id="food-name" placeholder="e.g. Chicken breast" {...register('name')} />
              {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" placeholder="e.g. 150g" {...register('quantity')} />
              {errors.quantity ? <p className="text-xs text-destructive">{errors.quantity.message}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-2">
              <Label htmlFor="calories">Calories</Label>
              <Input id="calories" type="number" {...register('calories')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proteinG">Protein (g)</Label>
              <Input id="proteinG" type="number" step="0.1" {...register('proteinG')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbsG">Carbs (g)</Label>
              <Input id="carbsG" type="number" step="0.1" {...register('carbsG')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatG">Fat (g)</Label>
              <Input id="fatG" type="number" step="0.1" {...register('fatG')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiberG">Fiber (g)</Label>
              <Input id="fiberG" type="number" step="0.1" {...register('fiberG')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : isEditing ? 'Save changes' : 'Add food'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
