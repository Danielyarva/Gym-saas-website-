import { apiRequest } from './api-client';
import type { ConversationListResult } from '@/types';

export const conversationsService = {
  list() {
    return apiRequest<ConversationListResult>('/api/messages');
  },
};
