import { UserPlus, Users, Activity, CalendarCheck, Sparkles, TrendingUp, TrendingDown, Repeat } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { AdminAnalytics } from '@/types';

function pctLabel(pct: number | null): string {
  return pct !== null ? `${pct}%` : '—';
}

export function AnalyticsStatGrid({ data }: { data: AdminAnalytics }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <StatCard label="New coaches" value={data.newCoaches.count} hint={`last ${data.newCoaches.windowDays} days`} icon={UserPlus} />
      <StatCard
        label="Active coaches"
        value={data.activeCoaches.count}
        hint={`of ${data.activeCoaches.totalCoaches} total, last ${data.activeCoaches.windowDays}d`}
        icon={Users}
      />
      <StatCard label="Active clients" value={data.activeClients.count} icon={Users} />
      <StatCard label="Weekly active users" value={data.weeklyActiveUsers.count} hint={`last ${data.weeklyActiveUsers.windowDays} days`} icon={Activity} />
      <StatCard
        label="Check-in rate"
        value={pctLabel(data.checkInRate.pct)}
        hint={`${data.checkInRate.numerator}/${data.checkInRate.denominator} clients, last ${data.checkInRate.windowDays}d`}
        icon={CalendarCheck}
      />
      <StatCard
        label="AI usage"
        value={data.aiUsage.requestCount}
        hint={`$${data.aiUsage.estimatedCostUsd.toFixed(2)} est. cost, last ${data.aiUsage.windowDays}d`}
        icon={Sparkles}
      />
      <StatCard
        label="Subscription conversion"
        value={pctLabel(data.subscriptionConversion.pct)}
        hint={`${data.subscriptionConversion.numerator}/${data.subscriptionConversion.denominator} coaches ever paid`}
        icon={TrendingUp}
      />
      <StatCard
        label="Churn"
        value={pctLabel(data.churn.pct)}
        hint={`${data.churn.numerator}/${data.churn.denominator} paid coaches`}
        icon={TrendingDown}
      />
      <StatCard
        label="Client retention"
        value={pctLabel(data.clientRetention.pct)}
        hint={`${data.clientRetention.numerator}/${data.clientRetention.denominator} clients ever added`}
        icon={Repeat}
      />
    </div>
  );
}
