import { apiRequest } from './api-client';
import type { Message, MessageListResult } from '@/types';

export const messagesService = {
  list(clientId: string, page = 1, pageSize = 50) {
    return apiRequest<MessageListResult>(`/api/clients/${clientId}/messages?page=${page}&pageSize=${pageSize}`);
  },

  send(clientId: string, content: string | undefined, attachment: File | undefined) {
    const formData = new FormData();
    if (content) formData.append('content', content);
    if (attachment) formData.append('attachment', attachment);
    return apiRequest<Message>(`/api/clients/${clientId}/messages`, { method: 'POST', body: formData });
  },

  typing(clientId: string) {
    return apiRequest<null>(`/api/clients/${clientId}/messages/typing`, { method: 'POST' });
  },
};
