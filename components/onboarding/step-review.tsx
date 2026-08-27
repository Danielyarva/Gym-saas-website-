'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCompleteOnboarding } from '@/hooks/use-onboarding';
import { ApiError } from '@/services/api-client';
import { StepHeader } from './step-shell';
import type { OnboardingState } from '@/types';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{value ?? '—'}</span>
    </div>
  );
}

export function StepReview({ clientId, onboarding, onBack, onDone }: { clientId: string; onboarding: OnboardingState; onBack: () => void; onDone: () => void }) {
  const complete = useCompleteOnboarding(clientId);

  const onSubmit = () => {
    complete.mutate(undefined, {
      onSuccess: () => {
        toast.success("You're all set!");
        onDone();
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
    });
  };

  return (
    <div>
      <StepHeader title="Review" description="Make sure everything looks right before finishing" />

      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Basic information</p>
          <Row label="Name" value={onboarding.basicInfo.fullName} />
          <Row label="Height" value={onboarding.basicInfo.heightCm ? `${onboarding.basicInfo.heightCm} cm` : null} />
        </div>
        <Separator />
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Goal</p>
          <Row label="Type" value={onboarding.goal?.type.replace(/_/g, ' ')} />
          <Row label="Target" value={onboarding.goal?.targetValue ? `${onboarding.goal.targetValue} ${onboarding.goal.targetUnit ?? ''}` : null} />
        </div>
        <Separator />
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Body measurements</p>
          <Row label="Weight" value={onboarding.bodyMeasurement?.weightKg ? `${onboarding.bodyMeasurement.weightKg} kg` : null} />
        </div>
        <Separator />
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Training & lifestyle</p>
          <Row label="Experience" value={onboarding.trainingExperience?.replace(/_/g, ' ')} />
          <Row label="Days / week" value={onboarding.trainingDaysPerWeek} />
          <Row label="Activity level" value={onboarding.activityLevel?.replace(/_/g, ' ')} />
          <Row label="Typical sleep" value={onboarding.typicalSleepHours ? `${onboarding.typicalSleepHours} hrs` : null} />
        </div>
        {onboarding.needsMedicalClearance ? (
          <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs text-foreground">
            You indicated you&apos;re not sure about a medical reason to avoid exercise — your coach will see this and follow up with you.
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 pt-6">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit} disabled={complete.isPending}>
          {complete.isPending ? 'Finishing…' : 'Finish onboarding'}
        </Button>
      </div>
    </div>
  );
}
