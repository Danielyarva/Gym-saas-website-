import { useQuery } from '@tanstack/react-query';
import { progressService } from '@/services/progress.service';
import type { ProgressRange } from '@/types';

export function useProgressCharts(clientId: string, range: ProgressRange) {
  return useQuery({
    queryKey: ['progress-charts', clientId, range] as const,
    queryFn: () => progressService.getCharts(clientId, range),
    enabled: Boolean(clientId),
  });
}
