'use client';

import { useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { CoachTable } from './coach-table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useAdminCoaches } from '@/hooks/use-admin';

const PAGE_SIZE = 20;

export function CoachList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isPending, isError, refetch } = useAdminCoaches(search, page, PAGE_SIZE);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or email…"
        value={search}
        onChange={(event) => {
          setPage(1);
          setSearch(event.target.value);
        }}
        className="max-w-sm"
      />

      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load coaches"
          description="Something went wrong fetching the coach list."
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title="No coaches found" description={search ? 'Try a different search.' : 'No coaches have signed up yet.'} />
      ) : (
        <>
          <CoachTable coaches={data.items} />

          {totalPages > 1 ? (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {data.total} coaches
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
    </div>
  );
}
