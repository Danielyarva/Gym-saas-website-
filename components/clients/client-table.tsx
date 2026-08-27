import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

export function ClientTable({ clients }: { clients: ClientSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Goal</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Adherence</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last check-in</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="cursor-pointer">
            <TableCell>
              <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(client.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{client.fullName}</p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                </div>
              </Link>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{client.goalText ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{formatWeight(client.currentWeightKg)}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{client.adherencePct !== null ? `${client.adherencePct}%` : '—'}</TableCell>
            <TableCell>
              <StatusBadge status={client.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">{client.lastCheckInAt ? formatRelativeTime(client.lastCheckInAt) : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
