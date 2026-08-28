'use client';

import { PageHeader } from '@/components/ui/page-header';
import { CurrentPlanCard } from '@/components/subscription/current-plan-card';
import { PlanPicker } from '@/components/subscription/plan-picker';
import { BillingHistory } from '@/components/subscription/billing-history';

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" description="Manage your plan and billing" />
      <CurrentPlanCard />
      <PlanPicker />
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Billing history</h2>
        <BillingHistory />
      </div>
    </div>
  );
}
