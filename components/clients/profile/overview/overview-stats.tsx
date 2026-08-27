import { Gauge, TrendingUp, CalendarClock, Target } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { formatRelativeTime } from '@/lib/format';
import type { ClientDetail } from '@/types';

export function OverviewStats({ client }: { client: ClientDetail }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Adherence" value={client.adherencePct !== null ? `${client.adherencePct}%` : '—'} icon={Gauge} />
      <StatCard label="Progress" value={client.progressPct !== null ? `${client.progressPct}%` : '—'} icon={TrendingUp} />
      <StatCard label="Last check-in" value={client.lastCheckInAt ? formatRelativeTime(client.lastCheckInAt) : 'None yet'} icon={CalendarClock} />
      <StatCard label="Goal" value={client.profile?.goalText ?? '—'} icon={Target} />
    </div>
  );
}
