'use client';

import { Search, ArrowUpDown, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ClientStatus } from '@/types';
import type { ListClientsParams } from '@/services/clients.service';

const STATUS_FILTERS: Array<{ value: ClientStatus; label: string }> = [
  { value: 'ON_TRACK', label: 'On track' },
  { value: 'NEEDS_ATTENTION', label: 'Needs attention' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'INACTIVE', label: 'Inactive' },
];

interface ClientListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ClientStatus[];
  onStatusToggle: (status: ClientStatus) => void;
  sortBy: NonNullable<ListClientsParams['sortBy']>;
  sortDir: NonNullable<ListClientsParams['sortDir']>;
  onSortByChange: (sortBy: NonNullable<ListClientsParams['sortBy']>) => void;
  onSortDirToggle: () => void;
  showArchived: boolean;
  onShowArchivedToggle: () => void;
  onAddClient: () => void;
}

export function ClientListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusToggle,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirToggle,
  showArchived,
  onShowArchivedToggle,
  onAddClient,
}: ClientListToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search clients…" className="pl-9" value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as typeof sortBy)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fullName">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="adherencePct">Adherence</SelectItem>
              <SelectItem value="lastCheckInAt">Last check-in</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={onSortDirToggle} aria-label="Toggle sort direction">
            <ArrowUpDown className={cn('h-4 w-4 transition-transform', sortDir === 'desc' && 'rotate-180')} />
          </Button>
          <Button onClick={onAddClient}>
            <UserPlus className="h-4 w-4" />
            Add client
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((filter) => {
          const active = statusFilter.includes(filter.value);
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onStatusToggle(filter.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                active ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {filter.label}
            </button>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border" />
        <button
          type="button"
          onClick={onShowArchivedToggle}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            showArchived ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          Archived
        </button>
      </div>
    </div>
  );
}
