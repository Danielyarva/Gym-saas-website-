import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, formatRelativeTime } from '@/lib/format';
import type { AdminCoachSummary } from '@/types';

export function CoachTable({ coaches }: { coaches: AdminCoachSummary[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Coach</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Active clients</TableHead>
          <TableHead>Signed up</TableHead>
          <TableHead>Last login</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {coaches.map((coach) => (
          <TableRow key={coach.id}>
            <TableCell>
              <p className="font-medium text-foreground">{coach.fullName}</p>
              <p className="text-xs text-muted-foreground">{coach.email}</p>
            </TableCell>
            <TableCell>
              <Badge variant={coach.plan === 'STARTER' ? 'muted' : 'default'}>{coach.plan}</Badge>
            </TableCell>
            <TableCell>{coach.activeClientCount}</TableCell>
            <TableCell>{formatDate(coach.createdAt)}</TableCell>
            <TableCell>{coach.lastLoginAt ? formatRelativeTime(coach.lastLoginAt) : 'Never'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
