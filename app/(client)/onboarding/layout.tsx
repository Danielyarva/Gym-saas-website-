'use client';

import { usePathname } from 'next/navigation';
import { Dumbbell } from 'lucide-react';
import { OnboardingStepper } from '@/components/ui/onboarding-stepper';

const TOTAL_STEPS = 10;

function currentStepFromPathname(pathname: string): number {
  if (pathname.endsWith('/review')) return 10;
  const match = pathname.match(/\/onboarding\/(\d+)/);
  return match ? Number(match[1]) : 1;
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStep = currentStepFromPathname(pathname);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">AI Coach OS</span>
        </div>

        <div className="space-y-2">
          <OnboardingStepper currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <p className="text-center text-xs text-muted-foreground">
            Step {currentStep} of {TOTAL_STEPS}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
