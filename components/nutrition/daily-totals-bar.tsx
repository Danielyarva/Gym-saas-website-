import type { NutritionTotals } from '@/types';

interface DailyTotalsBarProps {
  totals: NutritionTotals;
}

const STATS: { key: keyof NutritionTotals; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
  { key: 'fiberG', label: 'Fiber', unit: 'g' },
];

/** Shared between the coach's plan builder and the client's active-plan view — daily totals are computed server-side on read, never persisted. */
export function DailyTotalsBar({ totals }: DailyTotalsBarProps) {
  return (
    <div className="grid grid-cols-5 gap-2 rounded-lg border border-border bg-card p-3">
      {STATS.map((stat) => (
        <div key={stat.key} className="text-center">
          <p className="text-sm font-semibold text-foreground">{Math.round(totals[stat.key])}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {stat.label} ({stat.unit})
          </p>
        </div>
      ))}
    </div>
  );
}
