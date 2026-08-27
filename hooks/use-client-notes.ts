import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesService } from '@/services/notes.service';

export function useClientNotes(clientId: string) {
  return useQuery({
    queryKey: ['clients', clientId, 'notes'],
    queryFn: () => notesService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useAddNote(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => notesService.create(clientId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'notes'] });
    },
  });
}

export function useUpdateNote(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) => notesService.update(clientId, noteId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'notes'] });
    },
  });
}

export function useDeleteNote(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => notesService.remove(clientId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', clientId, 'notes'] });
    },
  });
}
