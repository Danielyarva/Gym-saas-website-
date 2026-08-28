import { useQuery } from '@tanstack/react-query';
import { reportsService } from '@/services/reports.service';

export function useCoachReports(page = 1) {
  return useQuery({
    queryKey: ['reports', page] as const,
    queryFn: () => reportsService.list(page),
  });
}
