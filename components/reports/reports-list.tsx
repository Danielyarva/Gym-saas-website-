'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useCoachReports } from '@/hooks/use-reports';
import { formatDate } from '@/lib/format';

/** The coach's own generated weekly reports across their whole roster (PRD §19) — cross-client, so it lives at a flat /reports page rather than nested under a single client. */
export function ReportsList() {
  const { data, isPending } = useCoachReports();

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.reports.length === 0) {
    return <EmptyState icon={FileText} title="No weekly reports yet" description="Generate a weekly report from a client's Progress tab to see it here." />;
  }

  return (
    <div className="space-y-3">
      {data.reports.map((report) => (
        <Link key={report.id} href={`/clients/${report.client.id}/progress`}>
          <Card className="transition-colors hover:bg-secondary/50">
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">{report.client.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  Week of {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
                </p>
                <p className="truncate text-sm text-foreground">{report.aiSummary}</p>
              </div>
              {report.overallProgressPct != null ? (
                <div className="shrink-0 text-right">
                  <p className="text-lg font-semibold text-foreground">{report.overallProgressPct}%</p>
                  <p className="text-xs text-muted-foreground">progress</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
