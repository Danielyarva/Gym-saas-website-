'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAddNote } from '@/hooks/use-client-notes';
import { noteFormSchema, type NoteFormValues } from '@/schemas/note.schema';
import { ApiError } from '@/services/api-client';

export function AddNoteForm({ clientId }: { clientId: string }) {
  const addNote = useAddNote(clientId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NoteFormValues>({ resolver: zodResolver(noteFormSchema) });

  const onSubmit = (values: NoteFormValues) => {
    addNote.mutate(values.body, {
      onSuccess: () => reset(),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Something went wrong'),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
      <Textarea placeholder="Add a note about this client…" rows={3} {...register('body')} />
      {errors.body ? <p className="text-xs text-destructive">{errors.body.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={addNote.isPending}>
          {addNote.isPending ? 'Saving…' : 'Add note'}
        </Button>
      </div>
    </form>
  );
}
