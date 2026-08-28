import { apiRequest } from './api-client';
import type { NotificationListResult } from '@/types';

export const notificationsService = {
  list(page = 1, pageSize = 20) {
    return apiRequest<NotificationListResult>(`/api/notifications?page=${page}&pageSize=${pageSize}`);
  },

  markRead(id: string) {
    return apiRequest<null>(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllRead() {
    return apiRequest<null>('/api/notifications/read-all', { method: 'POST' });
  },
};
