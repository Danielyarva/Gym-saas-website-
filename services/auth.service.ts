import { apiRequest } from './api-client';
import type { PublicCoach, PublicUser, Session } from '@/types';

interface MeResponse {
  user: PublicUser;
  coach: PublicCoach | null;
}

export const authService = {
  register(input: { fullName: string; email: string; password: string }) {
    return apiRequest<MeResponse>('/api/auth/register', { method: 'POST', body: input });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<MeResponse>('/api/auth/login', { method: 'POST', body: input });
  },

  logout() {
    return apiRequest<null>('/api/auth/logout', { method: 'POST' });
  },

  me() {
    return apiRequest<MeResponse>('/api/auth/me');
  },

  verifyEmail(token: string) {
    return apiRequest<null>('/api/auth/verify-email', { method: 'POST', body: { token } });
  },

  forgotPassword(email: string) {
    return apiRequest<null>('/api/auth/forgot-password', { method: 'POST', body: { email } });
  },

  resetPassword(token: string, newPassword: string) {
    return apiRequest<null>('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } });
  },

  sessions() {
    return apiRequest<Session[]>('/api/auth/sessions');
  },
};
