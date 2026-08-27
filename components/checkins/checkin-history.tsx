'use client';

import { useState } from 'react';
import { LineChart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { useCheckIns } from '@/hooks/use-checkins';

const MOOD_LABELS: Record<string, string> = { VERY_LOW: 'Very low', LOW: 'Low', NEUTRAL: 'Neutral', GOOD: 'Good', VERY_GOOD: 'Very good' };
const ADHERENCE_LABELS: Record<string, string> = { POOR: 'Poor', FAIR: 'Fair', GOOD: 'Good', EXCELLENT: 'Excellent' };

export function CheckInHistory({ clientId }: { clientId: string }) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useCheckIns(clientId, page);

  if (isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <EmptyState icon={LineChart} title="Couldn't load check-in history" />;
  }

  if (data.checkIns.length === 0) {
    return <EmptyState icon={LineChart} title="No check-ins yet" description="Check-ins the client submits will show up here." />;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-3">
      {data.checkIns.map((checkIn) => (
        <div key={checkIn.id} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{formatDate(checkIn.date)}</p>
            <div className="flex gap-1.5">
              {checkIn.mood ? <Badge variant="secondary">{MOOD_LABELS[checkIn.mood]}</Badge> : null}
              {checkIn.nutritionAdherence ? <Badge variant="outline">{ADHERENCE_LABELS[checkIn.nutritionAdherence]} nutrition</Badge> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground sm:grid-cols-4">
            {checkIn.weightKg !== null ? <span>{checkIn.weightKg} kg</span> : null}
            {checkIn.steps !== null ? <span>{checkIn.steps.toLocaleString()} steps</span> : null}
            {checkIn.sleepHours !== null ? <span>{checkIn.sleepHours}h sleep</span> : null}
            {checkIn.workoutCompleted !== null ? <span>{checkIn.workoutCompleted ? 'Workout done' : 'Workout skipped'}</span> : null}
          </div>
          {checkIn.notes ? <p className="mt-2 text-sm text-foreground">{checkIn.notes}</p> : null}
        </div>
      ))}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
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
    </div>
  );
}
