import { Users, TrendingUp, AlertTriangle, ShieldAlert, Gauge, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import type { DashboardData } from '@/types';

export function StatGrid({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard label="Active clients" value={data.activeClients} icon={Users} />
      <StatCard label="On track" value={data.statusBreakdown.onTrack} icon={TrendingUp} />
      <StatCard label="Needs attention" value={data.statusBreakdown.needsAttention} icon={AlertTriangle} />
      <StatCard label="At risk" value={data.statusBreakdown.atRisk} icon={ShieldAlert} />
      <StatCard label="Avg. adherence" value={data.averageAdherencePct !== null ? `${data.averageAdherencePct}%` : '—'} icon={Gauge} />
      <StatCard label="Avg. progress" value={data.averageProgressPct !== null ? `${data.averageProgressPct}%` : '—'} icon={Activity} />
    </div>
  );
}
