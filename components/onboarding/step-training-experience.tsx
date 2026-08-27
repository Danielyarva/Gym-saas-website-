'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { trainingExperienceStepSchema, trainingExperienceOptions, type TrainingExperienceStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

const LABELS: Record<(typeof trainingExperienceOptions)[number], string> = {
  BEGINNER: 'Beginner — new to structured training',
  INTERMEDIATE: 'Intermediate — training consistently for a while',
  ADVANCED: 'Advanced — years of dedicated training',
};

export function StepTrainingExperience({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof trainingExperienceStepSchema>, undefined, TrainingExperienceStepValues>({
    resolver: zodResolver(trainingExperienceStepSchema),
    defaultValues: {
      trainingExperience: (onboarding.trainingExperience as TrainingExperienceStepValues['trainingExperience']) ?? undefined,
      trainingDaysPerWeek: onboarding.trainingDaysPerWeek ?? undefined,
    },
  });

  const onSubmit = (values: TrainingExperienceStepValues) => {
    saveStep.mutate(
      { stepNumber: 4, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Training experience" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Experience level</Label>
          <Controller
            control={control}
            name="trainingExperience"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  {trainingExperienceOptions.map((option) => (
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
          <Label htmlFor="trainingDaysPerWeek">Days per week you can train</Label>
          <Input id="trainingDaysPerWeek" type="number" min={0} max={7} {...register('trainingDaysPerWeek')} />
          {errors.trainingDaysPerWeek ? <p className="text-xs text-destructive">{errors.trainingDaysPerWeek.message}</p> : null}
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
