'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveOnboardingStep } from '@/hooks/use-onboarding';
import { basicInfoStepSchema, type BasicInfoStepValues } from '@/schemas/onboarding.schema';
import { ApiError } from '@/services/api-client';
import { StepHeader, StepFooter, type OnboardingStepProps } from './step-shell';

export function StepBasicInfo({ clientId, onboarding, onNext }: OnboardingStepProps) {
  const saveStep = useSaveOnboardingStep(clientId);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof basicInfoStepSchema>, undefined, BasicInfoStepValues>({
    resolver: zodResolver(basicInfoStepSchema),
    defaultValues: {
      fullName: onboarding.basicInfo.fullName,
      phone: onboarding.basicInfo.phone ?? '',
      dateOfBirth: onboarding.basicInfo.dateOfBirth ? new Date(onboarding.basicInfo.dateOfBirth) : undefined,
      gender: onboarding.basicInfo.gender ?? '',
      heightCm: onboarding.basicInfo.heightCm ?? undefined,
    },
  });

  const onSubmit = (values: BasicInfoStepValues) => {
    saveStep.mutate(
      { stepNumber: 1, body: values },
      {
        onSuccess: onNext,
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StepHeader title="Basic information" description="Let's start with the essentials" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...register('fullName')} />
          {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" {...register('phone')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" type="date" {...register('dateOfBirth', { valueAsDate: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input id="heightCm" type="number" step="0.1" {...register('heightCm')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <Input id="gender" {...register('gender')} />
        </div>
      </div>

      <StepFooter isPending={saveStep.isPending} />
    </form>
  );
}
