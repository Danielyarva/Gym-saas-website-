import { apiRequest } from './api-client';
import type { OnboardingState } from '@/types';

export const onboardingService = {
  get(clientId: string) {
    return apiRequest<OnboardingState>(`/api/clients/${clientId}/onboarding`);
  },

  saveStep(clientId: string, stepNumber: number, body: Record<string, unknown>) {
    return apiRequest<OnboardingState>(`/api/clients/${clientId}/onboarding/step/${stepNumber}`, { method: 'PATCH', body });
  },

  complete(clientId: string) {
    return apiRequest<{ completedAt: string }>(`/api/clients/${clientId}/onboarding/complete`, { method: 'POST' });
  },
};
