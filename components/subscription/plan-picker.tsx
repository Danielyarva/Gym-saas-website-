'use client';

import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSubscriptionStatus, useDowngrade } from '@/hooks/use-subscription';
import { UpgradeButton } from './upgrade-button';
import { ApiError } from '@/services/api-client';
import type { PlanInfo, SubscriptionPlan } from '@/types';

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'PRO', 'BUSINESS'];

function formatPrice(priceInPaise: number): string {
  if (priceInPaise === 0) return 'Free';
  return `₹${(priceInPaise / 100).toLocaleString('en-IN')}/mo`;
}

function PlanCard({
  plan,
  isCurrent,
  onDowngrade,
  downgradePending,
}: {
  plan: PlanInfo;
  isCurrent: boolean;
  onDowngrade: () => void;
  downgradePending: boolean;
}) {
  return (
    <Card className={isCurrent ? 'border-primary' : undefined}>
      <CardHeader>
        <CardTitle>{plan.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-2xl font-semibold text-foreground">{formatPrice(plan.priceInPaise)}</p>
        <p className="text-sm text-muted-foreground">Up to {plan.maxClients} clients</p>
        {isCurrent ? (
          <Button className="w-full" variant="outline" disabled>
            Current plan
          </Button>
        ) : plan.plan === 'STARTER' ? (
          <Button className="w-full" variant="outline" onClick={onDowngrade} disabled={downgradePending}>
            {downgradePending ? 'Downgrading…' : 'Downgrade'}
          </Button>
        ) : (
          <UpgradeButton plan={plan.plan} label={`Upgrade to ${plan.label}`} />
        )}
      </CardContent>
    </Card>
  );
}

/** Every card is built from the status response's own `plans` array — no plan limit or price is ever hardcoded on the frontend either. */
export function PlanPicker() {
  const { data, isPending } = useSubscriptionStatus();
  const downgrade = useDowngrade();

  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const plans = [...data.plans].sort((a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan));

  const handleDowngrade = () => {
    downgrade.mutate(undefined, {
      onSuccess: () => toast.success('Downgraded to Starter'),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {plans.map((plan) => (
        <PlanCard key={plan.plan} plan={plan} isCurrent={plan.plan === data.plan} onDowngrade={handleDowngrade} downgradePending={downgrade.isPending} />
      ))}
    </div>
  );
}
