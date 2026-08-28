'use client';

import { UserPlus } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { AdminAnalytics } from '@/types';

/** Same recharts pattern as components/progress/metric-chart-card.tsx, bucketed weekly on the backend from real signup timestamps. */
export function WeeklySignupsChart({ trend }: { trend: AdminAnalytics['newCoachesWeeklyTrend'] }) {
  const hasAnySignups = trend.some((week) => week.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">New coach signups per week</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAnySignups ? (
          <EmptyState icon={UserPlus} title="No signups yet" className="py-6" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trend}>
              <XAxis dataKey="weekStart" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(value) => [value, 'New coaches']}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
