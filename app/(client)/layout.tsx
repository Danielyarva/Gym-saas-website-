'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/hooks/use-auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientShell } from '@/components/layout/client-shell';

/**
 * Role gate for every /onboarding, /today, /workout, /nutrition, /checkin
 * route — mirrors (dashboard)/layout.tsx's role check, but for CLIENT
 * instead of COACH. Also redirects to /onboarding whenever it isn't
 * complete yet (except while already on an onboarding route), and away
 * from /onboarding back to /today once it is.
 */
export default function ClientAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me, isPending: mePending, isError: meError } = useMe();
  const clientId = me?.client?.id ?? '';
  const { data: onboarding, isPending: onboardingPending } = useOnboarding(clientId);

  const wrongRole = Boolean(me && me.user.role !== 'CLIENT');
  const onOnboardingRoute = pathname.startsWith('/onboarding');

  useEffect(() => {
    if (meError) router.replace('/login');
    // ADMIN never belongs here, but sends them to their own home rather than
    // bouncing to /dashboard (whose own role-gate would just bounce them back).
    else if (wrongRole) router.replace(me?.user.role === 'ADMIN' ? '/admin' : '/dashboard');
  }, [meError, wrongRole, me, router]);

  useEffect(() => {
    if (!onboarding) return;
    if (!onboarding.completedAt && !onOnboardingRoute) router.replace('/onboarding');
    else if (onboarding.completedAt && onOnboardingRoute) router.replace('/today');
  }, [onboarding, onOnboardingRoute, router]);

  if (mePending || meError || wrongRole || (clientId && onboardingPending)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  return onOnboardingRoute ? <>{children}</> : <ClientShell>{children}</ClientShell>;
}
