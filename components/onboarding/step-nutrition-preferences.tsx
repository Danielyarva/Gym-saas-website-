'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { nutritionPreferencesStepSchema, type NutritionPreferencesStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

function commaListField(value: string[] | undefined, onChange: (next: string[]) => void, id: string, placeholder: string) {
  return (
    <Input
      id={id}
      placeholder={placeholder}
      defaultValue={value?.join(', ')}
      onChange={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

export function StepNutritionPreferences({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<z.input<typeof nutritionPreferencesStepSchema>, undefined, NutritionPreferencesStepValues>({
    resolver: zodResolver(nutritionPreferencesStepSchema),
    defaultValues: {
      dietaryPreferences: onboarding.dietaryPreferences,
      allergies: onboarding.allergies,
      mealsPerDayPreference: onboarding.mealsPerDayPreference ?? undefined,
    },
  });

  const onSubmit = (values: NutritionPreferencesStepValues) => {
    saveStep.mutate(
      { stepNumber: 6, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Nutrition preferences" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dietaryPreferences">Dietary preferences (comma-separated, optional)</Label>
          <Controller
            control={control}
            name="dietaryPreferences"
            render={({ field }) => commaListField(field.value, field.onChange, 'dietaryPreferences', 'vegetarian, halal, dairy-free…')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies">Food allergies (comma-separated, optional)</Label>
          <Controller control={control} name="allergies" render={({ field }) => commaListField(field.value, field.onChange, 'allergies', 'peanuts, shellfish…')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mealsPerDayPreference">Preferred meals per day</Label>
          <Input id="mealsPerDayPreference" type="number" min={1} max={10} {...register('mealsPerDayPreference')} />
          {errors.mealsPerDayPreference ? <p className="text-xs text-destructive">{errors.mealsPerDayPreference.message}</p> : null}
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
