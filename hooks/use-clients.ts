import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsService, type CreateClientInput, type ListClientsParams, type UpdateClientInput } from '@/services/clients.service';

export const clientsQueryKeys = {
  list: (params: ListClientsParams) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
};

export function useClients(params: ListClientsParams) {
  return useQuery({
    queryKey: clientsQueryKeys.list(params),
    queryFn: () => clientsService.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientsQueryKeys.detail(id),
    queryFn: () => clientsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => clientsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateClientInput) => clientsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useArchiveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUnarchiveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsService.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
