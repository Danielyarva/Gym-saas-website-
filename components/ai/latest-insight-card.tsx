'use client';

import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useAiInsights } from '@/hooks/use-ai-insights';
import type { AiRiskLevel } from '@/types';

const RISK_CONFIG: Record<AiRiskLevel, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  GREEN: { label: 'On track', variant: 'success' },
  YELLOW: { label: 'Needs attention', variant: 'warning' },
  RED: { label: 'At risk', variant: 'destructive' },
};

/** The latest AI risk analysis (PRD §17/§18) — generated automatically after this client's check-ins, never requested directly. */
export function LatestInsightCard({ clientId }: { clientId: string }) {
  const { data, isPending } = useAiInsights(clientId);
  const latest = data?.insights[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>AI risk analysis</CardTitle>
        {latest ? <Badge variant={RISK_CONFIG[latest.riskLevel].variant}>{RISK_CONFIG[latest.riskLevel].label}</Badge> : null}
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : !latest ? (
          <EmptyState icon={ShieldAlert} title="No analysis yet" description="Runs automatically after this client's next check-in." />
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {latest.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
