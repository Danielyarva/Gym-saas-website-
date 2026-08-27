import { Button } from '@/components/ui/button';
import type { OnboardingState } from '@/types';

export function StepHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 space-y-1 text-center">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

interface StepFooterProps {
  onBack?: () => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function StepFooter({ onBack, isPending, submitLabel = 'Continue' }: StepFooterProps) {
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
      ) : (
        <span />
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : submitLabel}
      </Button>
    </div>
  );
}

export interface OnboardingStepProps {
  clientId: string;
  onboarding: OnboardingState;
  onNext: () => void;
  onBack?: () => void;
}
