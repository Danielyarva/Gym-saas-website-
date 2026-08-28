import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardData } from '@/types';

/** Recent non-GREEN AI risk analyses (PRD §17/§18) across the coach's roster — populated once a client has been analyzed after a check-in. */
export function AiInsightsPanel({ insights }: { insights: DashboardData['aiInsights'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
      </CardHeader>
      <CardContent>
        {!insights.available ? (
          <EmptyState icon={Sparkles} title="No AI insights yet" description="Risk detection appears here once your clients start checking in." />
        ) : (
          <ul className="space-y-3">
            {insights.items.map((item) => (
              <li key={item} className="text-sm text-foreground">
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
