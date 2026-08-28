import { apiRequest } from './api-client';
import type { AiInsightListResult } from '@/types';

export const aiInsightsService = {
  list(clientId: string, page = 1, pageSize = 20) {
    return apiRequest<AiInsightListResult>(`/api/clients/${clientId}/ai/insights?page=${page}&pageSize=${pageSize}`);
  },
};
