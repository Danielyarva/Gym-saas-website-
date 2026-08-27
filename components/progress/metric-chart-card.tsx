'use client';

import { LineChart as LineChartIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { ProgressPoint } from '@/types';

interface MetricChartCardProps {
  title: string;
  unit?: string;
  series: ProgressPoint[];
}

/** Same recharts LineChart pattern as components/dashboard/client-progress-chart.tsx, reused per metric on the coach's Progress tab. */
export function MetricChartCard({ title, unit, series }: MetricChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {series.length === 0 ? (
          <EmptyState icon={LineChartIcon} title="No data yet" className="py-6" />
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={series}>
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(value) => [unit ? `${value}${unit}` : value, title]}
              />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
