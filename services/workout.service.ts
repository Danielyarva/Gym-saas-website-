import { apiRequest } from './api-client';
import type { TodayWorkout } from '@/types';

export interface MarkExerciseInput {
  completed: boolean;
  actualSets?: number;
  actualReps?: string;
  actualWeightKg?: number;
}

export const workoutService = {
  getToday(clientId: string) {
    return apiRequest<TodayWorkout>(`/api/clients/${clientId}/workout/today`);
  },

  markExercise(clientId: string, workoutExerciseId: string, input: MarkExerciseInput) {
    return apiRequest<{ completed: boolean }>(`/api/clients/${clientId}/workout/today/exercises/${workoutExerciseId}`, {
      method: 'PATCH',
      body: input,
    });
  },

  complete(clientId: string) {
    return apiRequest<{ status: string }>(`/api/clients/${clientId}/workout/today/complete`, { method: 'POST' });
  },
};
