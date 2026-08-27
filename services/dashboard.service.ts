import { apiRequest } from './api-client';
import type { DashboardData } from '@/types';

export const dashboardService = {
  get() {
    return apiRequest<DashboardData>('/api/dashboard');
  },
};
