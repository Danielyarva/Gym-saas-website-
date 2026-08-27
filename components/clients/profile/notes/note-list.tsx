'use client';

import { AlertTriangle, StickyNote } from 'lucide-react';
import { AddNoteForm } from './add-note-form';
import { NoteItem } from './note-item';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useClientNotes } from '@/hooks/use-client-notes';

export function NoteList({ clientId }: { clientId: string }) {
  const { data, isPending, isError, refetch } = useClientNotes(clientId);

  return (
    <div className="space-y-4">
      <AddNoteForm clientId={clientId} />

      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load notes"
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          }
        />
      ) : data.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes yet" description="Notes you add about this client will appear here." />
      ) : (
        <div className="space-y-3">
          {data.map((note) => (
            <NoteItem key={note.id} clientId={clientId} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
