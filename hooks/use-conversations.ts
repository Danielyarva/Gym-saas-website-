import { useQuery } from '@tanstack/react-query';
import { conversationsService } from '@/services/conversations.service';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'] as const,
    queryFn: () => conversationsService.list(),
  });
}
