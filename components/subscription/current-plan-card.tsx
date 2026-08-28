'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import { formatDate } from '@/lib/format';
import type { SubscriptionStatusValue } from '@/types';

const STATUS_CONFIG: Record<SubscriptionStatusValue, { label: string; variant: 'success' | 'warning' | 'muted' }> = {
  ACTIVE: { label: 'Active', variant: 'success' },
  PAST_DUE: { label: 'Past due', variant: 'warning' },
  CANCELED: { label: 'Canceled', variant: 'muted' },
};

export function CurrentPlanCard() {
  const { data, isPending } = useSubscriptionStatus();

  if (isPending || !data) {
    return <Skeleton className="h-32 w-full" />;
  }

  const plan = data.plans.find((p) => p.plan === data.plan);
  const statusConfig = STATUS_CONFIG[data.status];
  const usagePct = data.usage.limit > 0 ? Math.min(100, (data.usage.used / data.usage.limit) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{plan?.label ?? data.plan} plan</CardTitle>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Clients</span>
            <span className="font-medium text-foreground">
              {data.usage.used} of {data.usage.limit}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${usagePct}%` }} />
          </div>
        </div>
        {data.currentPeriodEnd ? <p className="text-sm text-muted-foreground">Renews {formatDate(data.currentPeriodEnd)}</p> : null}
      </CardContent>
    </Card>
  );
}
