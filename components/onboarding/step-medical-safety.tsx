'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { medicalSafetyStepSchema, type MedicalSafetyStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

export function StepMedicalSafety({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
  } = useForm<MedicalSafetyStepValues>({
    resolver: zodResolver(medicalSafetyStepSchema),
    defaultValues: {
      injuriesOrLimitations: onboarding.injuriesOrLimitations ?? '',
      clearedForExercise: onboarding.clearedForExercise ?? false,
    },
  });

  const onSubmit = (values: MedicalSafetyStepValues) => {
    saveStep.mutate(
      { stepNumber: 9, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Medical & safety" />

      <div className="mb-4 flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
        <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
        <p>
          This isn&apos;t a medical evaluation. If you have a condition that could make exercise unsafe, please consult a doctor or physical
          therapist before starting a new program. Your coach will see what you share here.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="injuriesOrLimitations">Injuries or physical limitations (optional)</Label>
          <Textarea id="injuriesOrLimitations" rows={3} placeholder="e.g. lower back sensitivity, previous knee surgery" {...register('injuriesOrLimitations')} />
        </div>

        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="clearedForExercise"
            render={({ field }) => <Checkbox id="clearedForExercise" checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />}
          />
          <Label htmlFor="clearedForExercise" className="font-normal leading-snug">
            I&apos;m not aware of any medical reason I should avoid moderate exercise.
          </Label>
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
