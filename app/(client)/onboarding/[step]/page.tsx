'use client';

import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { StepBasicInfo } from '@/components/onboarding/step-basic-info';
import { StepGoals } from '@/components/onboarding/step-goals';
import { StepBodyMeasurements } from '@/components/onboarding/step-body-measurements';
import { StepTrainingExperience } from '@/components/onboarding/step-training-experience';
import { StepEquipment } from '@/components/onboarding/step-equipment';
import { StepNutritionPreferences } from '@/components/onboarding/step-nutrition-preferences';
import { StepLifestyle } from '@/components/onboarding/step-lifestyle';
import { StepSleep } from '@/components/onboarding/step-sleep';
import { StepMedicalSafety } from '@/components/onboarding/step-medical-safety';
import type { OnboardingStepProps } from '@/components/onboarding/step-shell';

const STEP_COMPONENTS: Record<number, React.ComponentType<OnboardingStepProps>> = {
  1: StepBasicInfo,
  2: StepGoals,
  3: StepBodyMeasurements,
  4: StepTrainingExperience,
  5: StepEquipment,
  6: StepNutritionPreferences,
  7: StepLifestyle,
  8: StepSleep,
  9: StepMedicalSafety,
};

export default function OnboardingStepPage() {
  const { step } = useParams<{ step: string }>();
  const router = useRouter();
  const stepNumber = Number(step);
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';
  const { data: onboarding, isPending } = useOnboarding(clientId);

  if (isPending || !onboarding) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const StepComponent = STEP_COMPONENTS[stepNumber];
  if (!StepComponent) {
    router.replace('/onboarding/1');
    return null;
  }

  return (
    <StepComponent
      clientId={clientId}
      onboarding={onboarding}
      onNext={() => router.push(stepNumber < 9 ? `/onboarding/${stepNumber + 1}` : '/onboarding/review')}
      onBack={stepNumber > 1 ? () => router.push(`/onboarding/${stepNumber - 1}`) : undefined}
    />
  );
}
