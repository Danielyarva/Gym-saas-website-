'use client';

import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { AiNotConfiguredState } from './ai-not-configured-state';
import { useWeeklyReports, useGenerateWeeklyReport } from '@/hooks/use-weekly-reports';
import { ApiError } from '@/services/api-client';
import { formatDate } from '@/lib/format';

function ReportList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-foreground">{label}</p>
      <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

/** Coach-triggered — computes the most recently completed Mon–Sun week (PRD §19); regenerating the same week updates rather than duplicates. */
export function WeeklyReportCard({ clientId }: { clientId: string }) {
  const { data, isPending } = useWeeklyReports(clientId);
  const generate = useGenerateWeeklyReport(clientId);

  const handleGenerate = () => {
    generate.mutate(undefined, {
      onError: (error) => {
        if (!(error instanceof ApiError && error.code === 'AI_NOT_CONFIGURED')) {
          toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
        }
      },
    });
  };

  const notConfigured = generate.isError && generate.error instanceof ApiError && generate.error.code === 'AI_NOT_CONFIGURED';
  const latest = data?.reports[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Weekly report</CardTitle>
        <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generate.isPending}>
          {generate.isPending ? 'Generating…' : "Generate this week's report"}
        </Button>
      </CardHeader>
      <CardContent>
        {notConfigured ? (
          <AiNotConfiguredState feature="weekly reports" />
        ) : isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : !latest ? (
          <EmptyState icon={Sparkles} title="No reports yet" description="Generate this week's report for an AI summary of this client's progress." />
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Week of {formatDate(latest.weekStart)} – {formatDate(latest.weekEnd)}
            </p>
            <p className="text-sm text-foreground">{latest.aiSummary}</p>
            <ReportList label="Wins" items={latest.wins} />
            <ReportList label="Problems" items={latest.problems} />
            <ReportList label="Suggested actions" items={latest.suggestedActions} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
