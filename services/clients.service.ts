import { apiRequest } from './api-client';
import type { ClientDetail, ClientListResult, ClientStatus } from '@/types';

export interface ListClientsParams {
  search?: string;
  status?: ClientStatus[];
  archived?: boolean;
  sortBy?: 'fullName' | 'status' | 'adherencePct' | 'lastCheckInAt';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

function toQueryString(params: ListClientsParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status?.length) query.set('status', params.status.join(','));
  if (params.archived !== undefined) query.set('archived', String(params.archived));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortDir) query.set('sortDir', params.sortDir);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export interface CreateClientInput {
  fullName: string;
  email: string;
  phone?: string;
  goalText?: string;
  startingWeightKg?: number;
  goalWeightKg?: number;
}

export interface UpdateClientInput {
  fullName?: string;
  phone?: string;
  status?: ClientStatus;
  goalText?: string;
  currentWeightKg?: number;
  goalWeightKg?: number;
}

export const clientsService = {
  list(params: ListClientsParams) {
    return apiRequest<ClientListResult>(`/api/clients${toQueryString(params)}`);
  },

  getById(id: string) {
    return apiRequest<ClientDetail>(`/api/clients/${id}`);
  },

  create(input: CreateClientInput) {
    return apiRequest<ClientDetail>('/api/clients', { method: 'POST', body: input });
  },

  update(id: string, input: UpdateClientInput) {
    return apiRequest<ClientDetail>(`/api/clients/${id}`, { method: 'PATCH', body: input });
  },

  archive(id: string) {
    return apiRequest<null>(`/api/clients/${id}`, { method: 'DELETE' });
  },

  unarchive(id: string) {
    return apiRequest<null>(`/api/clients/${id}/unarchive`, { method: 'POST' });
  },

  invite(id: string) {
    return apiRequest<{ invitedAt: string; expiresAt: string }>(`/api/clients/${id}/invite`, { method: 'POST' });
  },
};
