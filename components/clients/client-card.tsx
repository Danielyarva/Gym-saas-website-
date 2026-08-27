import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatRelativeTime, formatWeight } from '@/lib/format';
import type { ClientSummary } from '@/types';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ClientCard({ client }: { client: ClientSummary }) {
  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar>
            <AvatarFallback>{initials(client.fullName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">{client.fullName}</p>
              <StatusBadge status={client.status} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {client.goalText ? <span className="truncate">{client.goalText}</span> : null}
              <span>{formatWeight(client.currentWeightKg)}</span>
              <span>{client.lastCheckInAt ? `Checked in ${formatRelativeTime(client.lastCheckInAt)}` : 'No check-ins yet'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
