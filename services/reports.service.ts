import { apiRequest } from './api-client';
import type { CoachReportListResult } from '@/types';

export const reportsService = {
  list(page = 1, pageSize = 20) {
    return apiRequest<CoachReportListResult>(`/api/reports?page=${page}&pageSize=${pageSize}`);
  },
};
