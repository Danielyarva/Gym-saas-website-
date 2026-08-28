import { useQuery } from '@tanstack/react-query';
import { aiInsightsService } from '@/services/ai-insights.service';

const keys = {
  list: (clientId: string) => ['ai-insights', clientId] as const,
};

export function useAiInsights(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => aiInsightsService.list(clientId),
    enabled: Boolean(clientId),
  });
}
