'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { sleepStepSchema, sleepQualityOptions, type SleepStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

const LABELS: Record<(typeof sleepQualityOptions)[number], string> = {
  POOR: 'Poor',
  FAIR: 'Fair',
  GOOD: 'Good',
  EXCELLENT: 'Excellent',
};

export function StepSleep({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof sleepStepSchema>, undefined, SleepStepValues>({
    resolver: zodResolver(sleepStepSchema),
    defaultValues: {
      typicalSleepHours: onboarding.typicalSleepHours ?? undefined,
      sleepQuality: (onboarding.sleepQuality as SleepStepValues['sleepQuality']) ?? undefined,
    },
  });

  const onSubmit = (values: SleepStepValues) => {
    saveStep.mutate(
      { stepNumber: 8, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Sleep" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="typicalSleepHours">Typical hours of sleep per night</Label>
          <Input id="typicalSleepHours" type="number" step="0.5" min={0} max={24} {...register('typicalSleepHours')} />
          {errors.typicalSleepHours ? <p className="text-xs text-destructive">{errors.typicalSleepHours.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Sleep quality</Label>
          <Controller
            control={control}
            name="sleepQuality"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sleepQualityOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
