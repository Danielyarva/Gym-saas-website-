'use client';

import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AnalyticsStatGrid } from '@/components/admin/analytics-stat-grid';
import { WeeklySignupsChart } from '@/components/admin/weekly-signups-chart';
import { useAdminAnalytics } from '@/hooks/use-admin';

export default function AdminOverviewPage() {
  const { data, isPending, isError, refetch } = useAdminAnalytics();

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load analytics"
        description="Something went wrong fetching platform analytics."
        action={
          <button type="button" onClick={() => refetch()} className="text-sm text-primary hover:underline">
            Try again
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Platform-wide SaaS metrics (PRD §31)." />
      <AnalyticsStatGrid data={data} />
      <WeeklySignupsChart trend={data.newCoachesWeeklyTrend} />
    </div>
  );
}
