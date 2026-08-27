import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { checkinsService, type SubmitCheckInInput } from '@/services/checkins.service';

const keys = {
  today: (clientId: string) => ['checkins', 'today', clientId] as const,
  list: (clientId: string, page: number) => ['checkins', 'list', clientId, page] as const,
};

export function useTodayCheckIn(clientId: string) {
  return useQuery({
    queryKey: keys.today(clientId),
    queryFn: () => checkinsService.getToday(clientId),
    enabled: Boolean(clientId),
  });
}

export function useCheckIns(clientId: string, page = 1) {
  return useQuery({
    queryKey: keys.list(clientId, page),
    queryFn: () => checkinsService.list(clientId, page),
    enabled: Boolean(clientId),
    placeholderData: (previous) => previous,
  });
}

export function useSubmitCheckIn(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitCheckInInput) => checkinsService.submit(clientId, input),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.today(clientId), data);
      queryClient.invalidateQueries({ queryKey: ['checkins', 'list', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients', 'detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients', 'list'] });
    },
  });
}
