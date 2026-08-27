'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, Users } from 'lucide-react';
import { ClientListToolbar } from './client-list-toolbar';
import { ClientCard } from './client-card';
import { ClientTable } from './client-table';
import { AddClientDialog } from './add-client-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import type { ClientStatus } from '@/types';
import type { ListClientsParams } from '@/services/clients.service';

const PAGE_SIZE = 20;

export function ClientList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<NonNullable<ListClientsParams['sortBy']>>('fullName');
  const [sortDir, setSortDir] = useState<NonNullable<ListClientsParams['sortDir']>>('asc');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(() => searchParams.get('new') === '1');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);

  const { data, isPending, isError, refetch } = useClients({
    search: search || undefined,
    status: statusFilter.length ? statusFilter : undefined,
    archived: showArchived,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  });

  const toggleStatus = (status: ClientStatus) => {
    setPage(1);
    setStatusFilter((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <ClientListToolbar
        search={search}
        onSearchChange={(value) => {
          setPage(1);
          setSearch(value);
        }}
        statusFilter={statusFilter}
        onStatusToggle={toggleStatus}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortByChange={(value) => {
          setPage(1);
          setSortBy(value);
        }}
        onSortDirToggle={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
        showArchived={showArchived}
        onShowArchivedToggle={() => {
          setPage(1);
          setShowArchived((prev) => !prev);
        }}
        onAddClient={() => setAddOpen(true)}
      />

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load clients"
          description="Something went wrong fetching your client list."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={showArchived ? 'No archived clients' : 'No clients yet'}
          description={showArchived ? 'Clients you archive will show up here.' : 'Add your first client to get started.'}
          action={
            !showArchived ? (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                Add client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {data.items.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
          <div className="hidden lg:block">
            <ClientTable clients={data.items} />
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {data.total} clients
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <AddClientDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
