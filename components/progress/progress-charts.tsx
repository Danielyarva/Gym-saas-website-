'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricChartCard } from './metric-chart-card';
import { useProgressCharts } from '@/hooks/use-progress-charts';
import type { ProgressRange } from '@/types';

const RANGE_OPTIONS: { value: ProgressRange; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: '3M', label: '3 Months' },
  { value: '6M', label: '6 Months' },
  { value: 'ALL', label: 'All Time' },
];

export function ProgressCharts({ clientId }: { clientId: string }) {
  const [range, setRange] = useState<ProgressRange>('MONTHLY');
  const { data, isPending } = useProgressCharts(clientId, range);

  return (
    <div className="space-y-4">
      <Tabs value={range} onValueChange={(value) => setRange(value as ProgressRange)}>
        <TabsList>
          {RANGE_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricChartCard title="Weight" unit="kg" series={data.weight} />
          <MetricChartCard title="Waist" unit="cm" series={data.waistCm} />
          <MetricChartCard title="Chest" unit="cm" series={data.chestCm} />
          <MetricChartCard title="Arms" unit="cm" series={data.armsCm} />
          <MetricChartCard title="Hips" unit="cm" series={data.hipsCm} />
          <MetricChartCard title="Thighs" unit="cm" series={data.thighsCm} />
          <MetricChartCard title="Steps" series={data.steps} />
          <MetricChartCard title="Sleep" unit="h" series={data.sleepHours} />
          <MetricChartCard title="Workout adherence" unit="%" series={data.workoutAdherence} />
          <MetricChartCard title="Nutrition adherence" unit="%" series={data.nutritionAdherence} />
        </div>
      )}
    </div>
  );
}
