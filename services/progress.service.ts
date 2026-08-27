import { apiRequest } from './api-client';
import type { ProgressCharts, ProgressRange } from '@/types';

export const progressService = {
  getCharts(clientId: string, range: ProgressRange) {
    return apiRequest<ProgressCharts>(`/api/clients/${clientId}/progress/charts?range=${range}`);
  },
};
