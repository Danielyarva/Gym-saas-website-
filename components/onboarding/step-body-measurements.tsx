'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { bodyMeasurementsStepSchema, type BodyMeasurementsStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

export function StepBodyMeasurements({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof bodyMeasurementsStepSchema>, undefined, BodyMeasurementsStepValues>({
    resolver: zodResolver(bodyMeasurementsStepSchema),
    defaultValues: {
      weightKg: onboarding.bodyMeasurement?.weightKg ?? undefined,
      waistCm: onboarding.bodyMeasurement?.waistCm ?? undefined,
      chestCm: onboarding.bodyMeasurement?.chestCm ?? undefined,
      armsCm: onboarding.bodyMeasurement?.armsCm ?? undefined,
      hipsCm: onboarding.bodyMeasurement?.hipsCm ?? undefined,
      thighsCm: onboarding.bodyMeasurement?.thighsCm ?? undefined,
    },
  });

  const onSubmit = (values: BodyMeasurementsStepValues) => {
    saveStep.mutate(
      { stepNumber: 3, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Body measurements" description="All optional — add what you're comfortable sharing" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weightKg">Current weight (kg)</Label>
          <Input id="weightKg" type="number" step="0.1" {...register('weightKg')} />
          {errors.weightKg ? <p className="text-xs text-destructive">{errors.weightKg.message}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="waistCm">Waist (cm)</Label>
            <Input id="waistCm" type="number" step="0.1" {...register('waistCm')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chestCm">Chest (cm)</Label>
            <Input id="chestCm" type="number" step="0.1" {...register('chestCm')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="armsCm">Arms (cm)</Label>
            <Input id="armsCm" type="number" step="0.1" {...register('armsCm')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hipsCm">Hips (cm)</Label>
            <Input id="hipsCm" type="number" step="0.1" {...register('hipsCm')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thighsCm">Thighs (cm)</Label>
            <Input id="thighsCm" type="number" step="0.1" {...register('thighsCm')} />
          </div>
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
