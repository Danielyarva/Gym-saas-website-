import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Progress } from '@/components/ui/progress';
import type { ClientProfileDetail } from '@/types';

function weightProgressPct(starting: number, current: number, goal: number): number {
  if (starting === goal) return 100;
  const total = Math.abs(goal - starting);
  const covered = Math.abs(current - starting);
  return Math.max(0, Math.min(100, Math.round((covered / total) * 100)));
}

export function WeightSummaryCard({ profile }: { profile: ClientProfileDetail | null }) {
  const { startingWeightKg, currentWeightKg, goalWeightKg } = profile ?? {};

  const hasFullPicture = startingWeightKg !== null && startingWeightKg !== undefined && currentWeightKg !== null && currentWeightKg !== undefined && goalWeightKg !== null && goalWeightKg !== undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weight</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasFullPicture ? (
          <EmptyState icon={Scale} title="No weight data yet" description="Set a starting and goal weight to track progress here." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Starting</p>
                <p className="text-lg font-semibold text-foreground">{startingWeightKg} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="text-lg font-semibold text-primary">{currentWeightKg} kg</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="text-lg font-semibold text-foreground">{goalWeightKg} kg</p>
              </div>
            </div>
            <Progress value={weightProgressPct(startingWeightKg, currentWeightKg, goalWeightKg)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
