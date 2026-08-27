import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

/** Always renders the empty state in Phase 1 — no AI call is made from here. AI Coach analysis ships in Phase 4 (PRD §17-18). */
export function AiInsightsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI insights</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState icon={Sparkles} title="AI insights are coming soon" description="Automatic risk detection and progress analysis ship in a later phase." />
      </CardContent>
    </Card>
  );
}
