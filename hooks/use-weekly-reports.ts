import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weeklyReportsService } from '@/services/weekly-reports.service';

const keys = {
  list: (clientId: string) => ['weekly-reports', clientId] as const,
};

export function useWeeklyReports(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => weeklyReportsService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useGenerateWeeklyReport(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => weeklyReportsService.generate(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}
