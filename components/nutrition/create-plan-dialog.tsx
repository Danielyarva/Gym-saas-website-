'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNutritionPlan } from '@/hooks/use-nutrition-plans';
import { createNutritionPlanFormSchema, type CreateNutritionPlanFormValues } from '@/schemas/nutrition-plan.schema';
import { ApiError } from '@/services/api-client';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onCreated: (planId: string) => void;
}

export function CreatePlanDialog({ open, onOpenChange, clientId, onCreated }: CreatePlanDialogProps) {
  const createPlan = useCreateNutritionPlan(clientId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof createNutritionPlanFormSchema>, undefined, CreateNutritionPlanFormValues>({
    resolver: zodResolver(createNutritionPlanFormSchema),
  });

  const onSubmit = (values: CreateNutritionPlanFormValues) => {
    createPlan.mutate(
      { name: values.name, dailyWaterTargetMl: values.dailyWaterTargetMl, notes: values.notes || undefined },
      {
        onSuccess: (plan) => {
          toast.success('Nutrition plan created');
          reset();
          onOpenChange(false);
          onCreated(plan.id);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New nutrition plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Plan name</Label>
            <Input id="name" placeholder="e.g. Cut Phase 1" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyWaterTargetMl">Daily water target (ml, optional)</Label>
            <Input id="dailyWaterTargetMl" type="number" {...register('dailyWaterTargetMl')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={3} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending ? 'Creating…' : 'Create plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
