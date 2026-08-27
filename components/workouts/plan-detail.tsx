'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { DayCard } from './day-card';
import { DayFormDialog } from './day-form-dialog';
import {
  useWorkoutPlan,
  useUpdateWorkoutPlan,
  useDeleteWorkoutPlan,
  useDuplicateWorkoutPlan,
  useReorderWorkoutDays,
} from '@/hooks/use-workout-plans';
import { ApiError } from '@/services/api-client';
import { CalendarDays } from 'lucide-react';

interface PlanDetailProps {
  clientId: string;
  planId: string;
  onDeleted: () => void;
  onDuplicated: (planId: string) => void;
}

export function PlanDetail({ clientId, planId, onDeleted, onDuplicated }: PlanDetailProps) {
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [deletePlanOpen, setDeletePlanOpen] = useState(false);

  const { data: plan, isPending, isError } = useWorkoutPlan(clientId, planId);
  const updatePlan = useUpdateWorkoutPlan(clientId, planId);
  const deletePlan = useDeleteWorkoutPlan(clientId);
  const duplicatePlan = useDuplicateWorkoutPlan(clientId);
  const reorderDays = useReorderWorkoutDays(clientId, planId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !plan) {
    return <EmptyState icon={CalendarDays} title="Couldn't load this plan" />;
  }

  function moveDay(index: number, direction: -1 | 1) {
    if (!plan) return;
    const ids = plan.days.map((d) => d.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    [ids[index], ids[targetIndex]] = [ids[targetIndex]!, ids[index]!];
    reorderDays.mutate(ids);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">{plan.name}</h2>
            <Badge variant={plan.status === 'ACTIVE' ? 'success' : plan.status === 'ARCHIVED' ? 'muted' : 'secondary'}>
              {plan.status === 'ACTIVE' ? 'Active' : plan.status === 'ARCHIVED' ? 'Archived' : 'Draft'}
            </Badge>
          </div>
          {plan.description ? <p className="text-sm text-muted-foreground">{plan.description}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {plan.status === 'DRAFT' ? (
            <Button
              size="sm"
              disabled={updatePlan.isPending}
              onClick={() =>
                updatePlan.mutate(
                  { status: 'ACTIVE' },
                  {
                    onSuccess: () => toast.success('Plan activated — assigned to the client'),
                    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
                  },
                )
              }
            >
              Set active
            </Button>
          ) : null}
          {plan.status === 'ACTIVE' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={updatePlan.isPending}
              onClick={() =>
                updatePlan.mutate(
                  { status: 'ARCHIVED' },
                  {
                    onSuccess: () => toast.success('Plan archived'),
                    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
                  },
                )
              }
            >
              Archive
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={duplicatePlan.isPending}
            onClick={() =>
              duplicatePlan.mutate(plan.id, {
                onSuccess: (copy) => {
                  toast.success('Plan duplicated as a new draft');
                  onDuplicated(copy.id);
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
              })
            }
          >
            <Copy /> Duplicate
          </Button>
          {plan.status === 'DRAFT' ? (
            <Button size="sm" variant="outline" onClick={() => setDeletePlanOpen(true)}>
              <Trash2 /> Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {plan.days.map((day, index) => (
          <DayCard
            key={day.id}
            clientId={clientId}
            planId={planId}
            day={day}
            isFirst={index === 0}
            isLast={index === plan.days.length - 1}
            onMoveUp={() => moveDay(index, -1)}
            onMoveDown={() => moveDay(index, 1)}
          />
        ))}

        {plan.days.length === 0 ? <EmptyState icon={CalendarDays} title="No days yet" description="Add the first day of this plan." /> : null}

        <Button variant="outline" size="sm" onClick={() => setAddDayOpen(true)}>
          <Plus /> Add day
        </Button>
      </div>

      <DayFormDialog open={addDayOpen} onOpenChange={setAddDayOpen} clientId={clientId} planId={planId} />

      <ConfirmDialog
        open={deletePlanOpen}
        onOpenChange={setDeletePlanOpen}
        title={`Delete "${plan.name}"?`}
        description="This permanently deletes the draft plan and everything in it."
        confirmLabel="Delete"
        destructive
        isPending={deletePlan.isPending}
        onConfirm={() =>
          deletePlan.mutate(plan.id, {
            onSuccess: () => {
              toast.success('Plan deleted');
              setDeletePlanOpen(false);
              onDeleted();
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
          })
        }
      />
    </div>
  );
}
