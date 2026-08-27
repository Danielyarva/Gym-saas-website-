'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { goalStepSchema, goalTypeOptions, type GoalStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

const GOAL_TYPE_LABELS: Record<(typeof goalTypeOptions)[number], string> = {
  WEIGHT_LOSS: 'Fat / weight loss',
  MUSCLE_GAIN: 'Muscle gain',
  ENDURANCE: 'Endurance',
  STRENGTH: 'Strength',
  MOBILITY: 'Mobility',
  GENERAL_FITNESS: 'General fitness',
  OTHER: 'Other',
};

export function StepGoals({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof goalStepSchema>, undefined, GoalStepValues>({
    resolver: zodResolver(goalStepSchema),
    defaultValues: {
      type: (onboarding.goal?.type as GoalStepValues['type']) ?? 'GENERAL_FITNESS',
      targetValue: onboarding.goal?.targetValue ?? undefined,
      targetUnit: onboarding.goal?.targetUnit ?? '',
      notes: onboarding.goal?.notes ?? '',
    },
  });

  const onSubmit = (values: GoalStepValues) => {
    saveStep.mutate(
      { stepNumber: 2, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="What's your main goal?" description="This helps your coach build the right plan for you" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Goal type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {GOAL_TYPE_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type ? <p className="text-xs text-destructive">{errors.type.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="targetValue">Target (optional)</Label>
            <Input id="targetValue" type="number" step="0.1" {...register('targetValue')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetUnit">Unit</Label>
            <Input id="targetUnit" placeholder="kg, reps, km…" {...register('targetUnit')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Anything else? (optional)</Label>
          <Textarea id="notes" rows={3} {...register('notes')} />
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
