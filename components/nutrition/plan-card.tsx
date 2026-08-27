'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { NutritionPlanSummary, NutritionPlanStatus } from '@/types';

const STATUS_CONFIG: Record<NutritionPlanStatus, { label: string; variant: 'success' | 'secondary' | 'muted' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  ACTIVE: { label: 'Active', variant: 'success' },
  ARCHIVED: { label: 'Archived', variant: 'muted' },
};

interface PlanCardProps {
  plan: NutritionPlanSummary;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const status = STATUS_CONFIG[plan.status];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors',
        selected ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-foreground">{plan.name}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </button>
  );
}
