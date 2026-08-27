'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';

export default function OnboardingIndexPage() {
  const router = useRouter();
  const { data: me } = useMe();
  const clientId = me?.client?.id ?? '';
  const { data: onboarding } = useOnboarding(clientId);

  useEffect(() => {
    if (!onboarding) return;
    const resumeStep = Math.min(onboarding.currentStep, 9);
    router.replace(onboarding.currentStep >= 10 ? '/onboarding/review' : `/onboarding/${resumeStep}`);
  }, [onboarding, router]);

  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
