import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesService } from '@/services/messages.service';

const MESSAGES_POLL_MS = 4000;

const keys = {
  list: (clientId: string) => ['messages', clientId] as const,
};

/** Polls per PRD §20's "start with REST + polling" — no WebSockets yet. */
export function useMessages(clientId: string) {
  return useQuery({
    queryKey: keys.list(clientId),
    queryFn: () => messagesService.list(clientId),
    enabled: Boolean(clientId),
    refetchInterval: MESSAGES_POLL_MS,
  });
}

export function useSendMessage(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, attachment }: { content?: string; attachment?: File }) => messagesService.send(clientId, content, attachment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(clientId) });
    },
  });
}

export function useTypingPing(clientId: string) {
  return useMutation({
    mutationFn: () => messagesService.typing(clientId),
  });
}
