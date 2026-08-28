import { apiRequest } from './api-client';
import type { AiChatListResult, AiMessage } from '@/types';

export const aiChatService = {
  list(clientId: string, page = 1, pageSize = 50) {
    return apiRequest<AiChatListResult>(`/api/clients/${clientId}/ai/chat?page=${page}&pageSize=${pageSize}`);
  },

  send(clientId: string, content: string) {
    return apiRequest<AiMessage>(`/api/clients/${clientId}/ai/chat`, { method: 'POST', body: { content } });
  },
};
