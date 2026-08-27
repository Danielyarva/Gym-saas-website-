'use client';

import { useParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ClientProfileHeader } from '@/components/clients/profile/client-profile-header';
import { ClientTabsNav } from '@/components/clients/profile/client-tabs-nav';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useClient } from '@/hooks/use-clients';

export default function ClientProfileLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const { data: client, isPending, isError, refetch } = useClient(id);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Client not found"
        description="This client doesn't exist or you don't have access to it."
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ClientProfileHeader client={client} />
      <ClientTabsNav clientId={id} />
      {children}
    </div>
  );
}
