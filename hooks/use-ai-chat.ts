import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiChatService } from '@/services/ai-chat.service';

const keys = {
  list: (clientId: string) => ['ai-chat', clientId] as const,
};

export function useAiChatMessages(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => aiChatService.list(clientId),
    enabled: Boolean(clientId),
  });
}

export function useSendAiChatMessage(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => aiChatService.send(clientId, content),
    // The client's message is saved even when the AI reply fails (e.g. not
    // configured), so refetch on both outcomes to pick it up either way.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}
