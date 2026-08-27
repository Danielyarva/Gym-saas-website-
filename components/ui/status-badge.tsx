import { Badge } from './badge';
import type { ClientStatus } from '@/types';

const STATUS_CONFIG: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' }> = {
  ON_TRACK: { label: 'On track', variant: 'success' },
  NEEDS_ATTENTION: { label: 'Needs attention', variant: 'warning' },
  AT_RISK: { label: 'At risk', variant: 'destructive' },
  INACTIVE: { label: 'Inactive', variant: 'muted' },
};

export function StatusBadge({ status }: { status: ClientStatus }) {
  const { label, variant } = STATUS_CONFIG[status];
  return <Badge variant={variant}>{label}</Badge>;
}
