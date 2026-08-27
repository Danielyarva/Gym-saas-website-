import { ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

/** Always renders the empty state in Phase 1 — task tracking doesn't exist yet (a later phase). */
export function UpcomingTasksPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState icon={ListChecks} title="No tasks yet" description="Suggested follow-ups and reminders will show up here." />
      </CardContent>
    </Card>
  );
}
