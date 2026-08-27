'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { lifestyleStepSchema, activityLevelOptions, type LifestyleStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

const LABELS: Record<(typeof activityLevelOptions)[number], string> = {
  SEDENTARY: 'Sedentary — mostly sitting',
  LIGHTLY_ACTIVE: 'Lightly active',
  MODERATELY_ACTIVE: 'Moderately active',
  VERY_ACTIVE: 'Very active',
};

export function StepLifestyle({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof lifestyleStepSchema>, undefined, LifestyleStepValues>({
    resolver: zodResolver(lifestyleStepSchema),
    defaultValues: {
      activityLevel: (onboarding.activityLevel as LifestyleStepValues['activityLevel']) ?? undefined,
      occupationType: onboarding.occupationType ?? '',
      stressLevel: onboarding.stressLevel ?? undefined,
    },
  });

  const onSubmit = (values: LifestyleStepValues) => {
    saveStep.mutate(
      { stepNumber: 7, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Lifestyle" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Daily activity level</Label>
          <Controller
            control={control}
            name="activityLevel"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {activityLevelOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="occupationType">Occupation type (optional)</Label>
          <Input id="occupationType" placeholder="e.g. desk job, on my feet all day" {...register('occupationType')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stressLevel">Typical stress level (1 = low, 5 = high)</Label>
          <Input id="stressLevel" type="number" min={1} max={5} {...register('stressLevel')} />
          {errors.stressLevel ? <p className="text-xs text-destructive">{errors.stressLevel.message}</p> : null}
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
