'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Mail, MailCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArchiveClientDialog } from '@/components/clients/archive-client-dialog';
import { useInviteClient, useUnarchiveClient } from '@/hooks/use-clients';
import { ApiError } from '@/services/api-client';
import type { ClientDetail } from '@/types';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ClientProfileHeader({ client }: { client: ClientDetail }) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = useState(false);
  const unarchiveClient = useUnarchiveClient();
  const inviteClient = useInviteClient(client.id);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-base">{initials(client.fullName)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{client.fullName}</h1>
            <StatusBadge status={client.status} />
          </div>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {client.hasAccount ? (
          <Badge variant="secondary">
            <MailCheck className="h-3 w-3" />
            App account linked
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={inviteClient.isPending}
            onClick={() =>
              inviteClient.mutate(undefined, {
                onSuccess: () => toast.success(`Invite sent to ${client.email}`),
                onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
              })
            }
          >
            <Mail className="h-4 w-4" />
            {inviteClient.isPending ? 'Sending…' : 'Invite to app'}
          </Button>
        )}

        {client.archivedAt ? (
          <Button
            variant="outline"
            size="sm"
            disabled={unarchiveClient.isPending}
            onClick={() =>
              unarchiveClient.mutate(client.id, {
                onSuccess: () => {
                  toast.success(`${client.fullName} restored`);
                  router.refresh();
                },
                onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
              })
            }
          >
            <ArchiveRestore className="h-4 w-4" />
            Restore client
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setArchiveOpen(true)}>
            <Archive className="h-4 w-4" />
            Archive client
          </Button>
        )}
      </div>

      <ArchiveClientDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        clientId={client.id}
        clientName={client.fullName}
        onArchived={() => router.push('/clients')}
      />
    </div>
  );
}
