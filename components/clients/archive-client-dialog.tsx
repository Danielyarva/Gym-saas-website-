'use client';

import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useArchiveClient } from '@/hooks/use-clients';
import { ApiError } from '@/services/api-client';

interface ArchiveClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onArchived?: () => void;
}

export function ArchiveClientDialog({ open, onOpenChange, clientId, clientName, onArchived }: ArchiveClientDialogProps) {
  const archiveClient = useArchiveClient();

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Archive ${clientName}?`}
      description="Archived clients are hidden from your active roster but can be restored at any time."
      confirmLabel="Archive"
      destructive
      isPending={archiveClient.isPending}
      onConfirm={() =>
        archiveClient.mutate(clientId, {
          onSuccess: () => {
            toast.success(`${clientName} archived`);
            onOpenChange(false);
            onArchived?.();
          },
          onError: (error) => {
            toast.error(error instanceof ApiError ? error.message : 'Something went wrong');
          },
        })
      }
    />
  );
}
