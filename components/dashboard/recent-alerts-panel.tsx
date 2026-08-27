import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardActivityItem } from '@/types';
import { formatRelativeTime } from '@/lib/format';

export function RecentAlertsPanel({ items }: { items: DashboardActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No alerts" description="Status changes that need your attention will appear here." />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-foreground">{item.summary}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
