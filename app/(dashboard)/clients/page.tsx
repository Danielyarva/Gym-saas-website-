'use client';

import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ClientList } from '@/components/clients/client-list';

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="Manage your client roster" />
      <Suspense>
        <ClientList />
      </Suspense>
    </div>
  );
}
