'use client';

import { LineChart as LineChartIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { DashboardData } from '@/types';

export function ClientProgressChart({ chart }: { chart: DashboardData['clientProgressChart'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client progress</CardTitle>
      </CardHeader>
      <CardContent>
        {!chart.available || chart.series.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="No progress data yet"
            description="Once clients start logging check-ins, their average progress will appear here."
          />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chart.series}>
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
