import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingStepperProps {
  currentStep: number;
  totalSteps: number;
}

/** Numbered-circle progress indicator for the onboarding wizard. Bespoke Tailwind layout — no Radix primitive fits a step indicator, unlike most of components/ui/. */
export function OnboardingStepper({ currentStep, totalSteps }: OnboardingStepperProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
        const isComplete = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors',
                isComplete && 'bg-primary text-primary-foreground',
                isCurrent && 'border-2 border-primary text-primary',
                !isComplete && !isCurrent && 'border border-border text-muted-foreground',
              )}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {step < totalSteps ? <div className={cn('h-px flex-1', isComplete ? 'bg-primary' : 'bg-border')} /> : null}
          </div>
        );
      })}
    </div>
  );
}
