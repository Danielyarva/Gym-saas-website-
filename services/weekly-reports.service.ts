import { apiRequest } from './api-client';
import type { WeeklyReport, WeeklyReportListResult } from '@/types';

export const weeklyReportsService = {
  list(clientId: string, page = 1, pageSize = 20) {
    return apiRequest<WeeklyReportListResult>(`/api/clients/${clientId}/ai/weekly-report?page=${page}&pageSize=${pageSize}`);
  },

  generate(clientId: string) {
    return apiRequest<WeeklyReport>(`/api/clients/${clientId}/ai/weekly-report`, { method: 'POST', body: {} });
  },
};
