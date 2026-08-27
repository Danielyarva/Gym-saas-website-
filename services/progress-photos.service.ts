import { apiRequest } from './api-client';
import type { ProgressPhoto, ProgressPhotoListResult } from '@/types';

export const progressPhotosService = {
  list(clientId: string, page = 1, pageSize = 50) {
    return apiRequest<ProgressPhotoListResult>(`/api/clients/${clientId}/progress-photos?page=${page}&pageSize=${pageSize}`);
  },

  upload(clientId: string, file: File, takenAt: string) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('takenAt', takenAt);
    return apiRequest<ProgressPhoto>(`/api/clients/${clientId}/progress-photos`, { method: 'POST', body: formData });
  },

  remove(clientId: string, photoId: string) {
    return apiRequest<null>(`/api/clients/${clientId}/progress-photos/${photoId}`, { method: 'DELETE' });
  },
};
