'use client';

import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatGrid } from '@/components/dashboard/stat-grid';
import { ClientProgressChart } from '@/components/dashboard/client-progress-chart';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { RecentAlertsPanel } from '@/components/dashboard/recent-alerts-panel';
import { AiInsightsPanel } from '@/components/dashboard/ai-insights-panel';
import { UpcomingTasksPanel } from '@/components/dashboard/upcoming-tasks-panel';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { useDashboard } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboard();
  const coach = useAuthStore((state) => state.coach);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load your dashboard"
        description="Something went wrong fetching your dashboard data."
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
      <PageHeader title={coach ? `Welcome back, ${coach.fullName.split(' ')[0]}` : 'Dashboard'} description="Here's how your clients are doing today." />

      <StatGrid data={data} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ClientProgressChart chart={data.clientProgressChart} />
          <RecentActivityFeed items={data.recentActivity} />
        </div>
        <div className="space-y-4">
          <QuickActions />
          <RecentAlertsPanel items={data.recentAlerts} />
          <AiInsightsPanel insights={data.aiInsights} />
          <UpcomingTasksPanel />
        </div>
      </div>
    </div>
  );
}
