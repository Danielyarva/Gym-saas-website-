'use client';

import { useState } from 'react';
import { Plus, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanCard } from './plan-card';
import { PlanDetail } from './plan-detail';
import { CreatePlanDialog } from './create-plan-dialog';
import { useWorkoutPlans } from '@/hooks/use-workout-plans';

export function WorkoutPlanBuilder({ clientId }: { clientId: string }) {
  const { data: plans, isPending } = useWorkoutPlans(clientId);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // Defaults to the first plan until the user picks one explicitly — derived
  // at render time rather than synced via an effect, since it's a pure
  // function of `plans` and `selectedPlanId`.
  const effectiveSelectedPlanId = selectedPlanId ?? plans?.[0]?.id ?? null;

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <div className="space-y-2">
        <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
          <Plus /> New plan
        </Button>
        {plans && plans.length > 0 ? (
          <div className="space-y-2">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} selected={plan.id === effectiveSelectedPlanId} onSelect={() => setSelectedPlanId(plan.id)} />
            ))}
          </div>
        ) : null}
      </div>

      <div>
        {effectiveSelectedPlanId ? (
          <PlanDetail
            clientId={clientId}
            planId={effectiveSelectedPlanId}
            onDeleted={() => setSelectedPlanId(null)}
            onDuplicated={(planId) => setSelectedPlanId(planId)}
          />
        ) : (
          <EmptyState icon={ClipboardList} title="No workout plans yet" description="Create a plan to start building this client's training program." />
        )}
      </div>

      <CreatePlanDialog open={createOpen} onOpenChange={setCreateOpen} clientId={clientId} onCreated={(planId) => setSelectedPlanId(planId)} />
    </div>
  );
}
