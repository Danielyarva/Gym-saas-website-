'use client';

import { useState } from 'react';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteNote, useUpdateNote } from '@/hooks/use-client-notes';
import { formatRelativeTime } from '@/lib/format';
import { ApiError } from '@/services/api-client';
import type { ClientNote } from '@/types';

export function NoteItem({ clientId, note }: { clientId: string; note: ClientNote }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const updateNote = useUpdateNote(clientId);
  const deleteNote = useDeleteNote(clientId);

  const handleSave = () => {
    if (!draft.trim()) return;
    updateNote.mutate(
      { noteId: note.id, body: draft.trim() },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
      },
    );
  };

  return (
    <div className="rounded-lg border border-border p-4">
      {editing ? (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setDraft(note.body); }}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateNote.isPending}>
              <Check className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {note.authorName} · {formatRelativeTime(note.createdAt)}
              {note.updatedAt !== note.createdAt ? ' (edited)' : ''}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(true)} aria-label="Edit note">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteOpen(true)} aria-label="Delete note">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete"
        destructive
        isPending={deleteNote.isPending}
        onConfirm={() =>
          deleteNote.mutate(note.id, {
            onSuccess: () => setDeleteOpen(false),
            onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
          })
        }
      />
    </div>
  );
}
