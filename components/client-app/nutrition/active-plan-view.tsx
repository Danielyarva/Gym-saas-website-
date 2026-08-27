'use client';

import { UtensilsCrossed, Droplet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { DailyTotalsBar } from '@/components/nutrition/daily-totals-bar';
import { useActiveNutritionPlan } from '@/hooks/use-nutrition-plans';
import { ApiError } from '@/services/api-client';

const MEAL_TYPE_LABELS: Record<string, string> = { BREAKFAST: 'Breakfast', LUNCH: 'Lunch', DINNER: 'Dinner', SNACK: 'Snack' };

export function ActivePlanView({ clientId }: { clientId: string }) {
  const { data, isPending, isError, error } = useActiveNutritionPlan(clientId);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    const noActivePlan = error instanceof ApiError && error.code === 'PLAN_NOT_ACTIVE';
    return (
      <EmptyState
        icon={UtensilsCrossed}
        title={noActivePlan ? 'No active nutrition plan yet' : "Couldn't load your nutrition plan"}
        description={noActivePlan ? 'Your coach hasn\'t assigned a nutrition plan yet.' : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Today&apos;s nutrition</p>
        <h1 className="text-lg font-semibold text-foreground">{data.name}</h1>
        {data.dailyWaterTargetMl ? (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Droplet className="h-3.5 w-3.5" /> {data.dailyWaterTargetMl}ml water target
          </p>
        ) : null}
      </div>

      <DailyTotalsBar totals={data.dailyTotals} />

      <div className="space-y-3">
        {data.meals.map((meal) => (
          <div key={meal.id} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{meal.name || MEAL_TYPE_LABELS[meal.type]}</p>
              <Badge variant="secondary">{MEAL_TYPE_LABELS[meal.type]}</Badge>
              <span className="text-xs text-muted-foreground">{Math.round(meal.totals.calories)} kcal</span>
            </div>
            <div className="space-y-1.5">
              {meal.foods.map((food) => (
                <div key={food.id} className="text-sm text-foreground">
                  {food.name} <span className="text-muted-foreground">· {food.quantity} · {food.calories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
