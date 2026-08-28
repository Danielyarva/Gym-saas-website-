import { apiRequest } from './api-client';
import type { AdminAnalytics, AdminCoachListResponse } from '@/types';

export const adminService = {
  getAnalytics() {
    return apiRequest<AdminAnalytics>('/api/admin/analytics');
  },

  listCoaches(search: string, page: number, pageSize: number) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set('search', search);
    return apiRequest<AdminCoachListResponse>(`/api/admin/coaches?${params.toString()}`);
  },
};
