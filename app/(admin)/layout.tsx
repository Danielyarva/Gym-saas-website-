'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/layout/admin-shell';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, isPending, isError } = useMe();
  const wrongRole = Boolean(me && me.user.role !== 'ADMIN');

  useEffect(() => {
    if (isError) router.replace('/login');
    // Straight to the actual role's home, not a bounce through the other layout's own gate.
    else if (wrongRole) router.replace(me?.user.role === 'CLIENT' ? '/today' : '/dashboard');
  }, [isError, wrongRole, me, router]);

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

  return <AdminShell>{children}</AdminShell>;
}
