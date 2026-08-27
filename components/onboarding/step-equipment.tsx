'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { equipmentStepSchema, type EquipmentStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

export function StepEquipment({ clientId, onboarding, onNext, onBack }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    control,
  } = useForm<EquipmentStepValues>({
    resolver: zodResolver(equipmentStepSchema),
    defaultValues: {
      equipmentList: onboarding.equipmentList,
      equipmentNotes: onboarding.equipmentNotes ?? '',
    },
  });

  const onSubmit = (values: EquipmentStepValues) => {
    saveStep.mutate(
      { stepNumber: 5, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Equipment access" description="What do you have available to train with?" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="equipmentList">Equipment (comma-separated)</Label>
          <Controller
            control={control}
            name="equipmentList"
            render={({ field }) => (
              <Input
                id="equipmentList"
                placeholder="dumbbells, bench, resistance bands…"
                defaultValue={field.value?.join(', ')}
                onChange={(e) =>
                  field.onChange(
                    e.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  )
                }
              />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="equipmentNotes">Anything else? (optional)</Label>
          <Textarea id="equipmentNotes" rows={3} placeholder="e.g. full home gym, or gym membership with machines" {...register('equipmentNotes')} />
        </div>
      </div>

      <StepFooter onBack={onBack} isPending={saveStep.isPending} />
    </form>
  );
}
