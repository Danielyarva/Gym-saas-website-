import { apiRequest } from './api-client';
import type { InvitePreview, PublicClient, PublicCoach, PublicUser, Session } from '@/types';

interface MeResponse {
  user: PublicUser;
  coach: PublicCoach | null;
  client: PublicClient | null;
}

interface CoachAuthResponse {
  user: PublicUser;
  coach: PublicCoach | null;
}

interface AcceptInviteResponse {
  user: PublicUser;
  client: PublicClient | null;
}

export const authService = {
  register(input: { fullName: string; email: string; password: string }) {
    return apiRequest<CoachAuthResponse>('/api/auth/register', { method: 'POST', body: input });
  },

  login(input: { email: string; password: string }) {
    return apiRequest<CoachAuthResponse>('/api/auth/login', { method: 'POST', body: input });
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

  getInvitePreview(token: string) {
    return apiRequest<InvitePreview>(`/api/auth/invite/${token}`);
  },

  acceptInvite(token: string, password: string) {
    return apiRequest<AcceptInviteResponse>(`/api/auth/invite/${token}/accept`, { method: 'POST', body: { password } });
  },
};
