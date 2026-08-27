'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isPending, isError } = useMe();
  const wrongRole = Boolean(me && me.user.role !== 'COACH');

  useEffect(() => {
    if (isError) router.replace('/login');
    else if (wrongRole) router.replace('/today');
  }, [isError, wrongRole, router]);

  if (isPending || isError || wrongRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
