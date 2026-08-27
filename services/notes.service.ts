import { apiRequest } from './api-client';
import type { ClientNote } from '@/types';

export const notesService = {
  list(clientId: string) {
    return apiRequest<ClientNote[]>(`/api/clients/${clientId}/notes`);
  },

  create(clientId: string, body: string) {
    return apiRequest<ClientNote>(`/api/clients/${clientId}/notes`, { method: 'POST', body: { body } });
  },

  update(clientId: string, noteId: string, body: string) {
    return apiRequest<ClientNote>(`/api/clients/${clientId}/notes/${noteId}`, { method: 'PATCH', body: { body } });
  },

  remove(clientId: string, noteId: string) {
    return apiRequest<null>(`/api/clients/${clientId}/notes/${noteId}`, { method: 'DELETE' });
  },
};
