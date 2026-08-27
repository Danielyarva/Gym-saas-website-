import { apiRequest } from './api-client';
import type { DailyCheckIn, CheckInListResult, MoodLevel, EnergyLevel, AdherenceLevel } from '@/types';

export interface SubmitCheckInInput {
  weightKg?: number;
  workoutCompleted?: boolean;
  steps?: number;
  sleepHours?: number;
  mood?: MoodLevel;
  energy?: EnergyLevel;
  nutritionAdherence?: AdherenceLevel;
  notes?: string;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  hipsCm?: number;
  thighsCm?: number;
}

export const checkinsService = {
  submit(clientId: string, input: SubmitCheckInInput) {
    return apiRequest<DailyCheckIn>(`/api/clients/${clientId}/checkins`, { method: 'POST', body: input });
  },

  getToday(clientId: string) {
    return apiRequest<DailyCheckIn | null>(`/api/clients/${clientId}/checkins/today`);
  },

  list(clientId: string, page = 1, pageSize = 20) {
    return apiRequest<CheckInListResult>(`/api/clients/${clientId}/checkins?page=${page}&pageSize=${pageSize}`);
  },
};
