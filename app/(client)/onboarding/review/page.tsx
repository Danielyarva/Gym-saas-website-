'use client';

import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { StepReview } from '@/components/onboarding/step-review';

export default function OnboardingReviewPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';
  const { data: onboarding, isPending } = useOnboarding(clientId);

  if (isPending || !onboarding) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <StepReview
      clientId={clientId}
      onboarding={onboarding}
      onBack={() => router.push('/onboarding/9')}
      onDone={() => router.push('/today')}
    />
  );
}
