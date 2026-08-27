import { apiRequest } from './api-client';
import type { WorkoutPlanSummary, WorkoutPlanDetail, WorkoutDayDetail, WorkoutExerciseDetail, WorkoutPlanStatus } from '@/types';

export interface CreateWorkoutPlanInput {
  name: string;
  description?: string;
}

export interface UpdateWorkoutPlanInput {
  name?: string;
  description?: string;
  status?: WorkoutPlanStatus;
}

export interface WorkoutDayInput {
  label: string;
  isRestDay?: boolean;
  dayOfWeek?: number;
  notes?: string;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets: number;
  reps: string;
  weightKg?: number;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
}

const base = (clientId: string) => `/api/clients/${clientId}/workout-plans`;

export const workoutPlansService = {
  list(clientId: string) {
    return apiRequest<WorkoutPlanSummary[]>(base(clientId));
  },

  getById(clientId: string, planId: string) {
    return apiRequest<WorkoutPlanDetail>(`${base(clientId)}/${planId}`);
  },

  create(clientId: string, input: CreateWorkoutPlanInput) {
    return apiRequest<WorkoutPlanDetail>(base(clientId), { method: 'POST', body: input });
  },

  update(clientId: string, planId: string, input: UpdateWorkoutPlanInput) {
    return apiRequest<WorkoutPlanDetail>(`${base(clientId)}/${planId}`, { method: 'PATCH', body: input });
  },

  remove(clientId: string, planId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}`, { method: 'DELETE' });
  },

  duplicate(clientId: string, planId: string) {
    return apiRequest<WorkoutPlanDetail>(`${base(clientId)}/${planId}/duplicate`, { method: 'POST' });
  },

  createDay(clientId: string, planId: string, input: WorkoutDayInput) {
    return apiRequest<WorkoutDayDetail>(`${base(clientId)}/${planId}/days`, { method: 'POST', body: input });
  },

  updateDay(clientId: string, planId: string, dayId: string, input: Partial<WorkoutDayInput>) {
    return apiRequest<WorkoutDayDetail>(`${base(clientId)}/${planId}/days/${dayId}`, { method: 'PATCH', body: input });
  },

  deleteDay(clientId: string, planId: string, dayId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}/days/${dayId}`, { method: 'DELETE' });
  },

  reorderDays(clientId: string, planId: string, orderedIds: string[]) {
    return apiRequest<null>(`${base(clientId)}/${planId}/days/reorder`, { method: 'PATCH', body: { orderedIds } });
  },

  createExercise(clientId: string, planId: string, dayId: string, input: WorkoutExerciseInput) {
    return apiRequest<WorkoutExerciseDetail>(`${base(clientId)}/${planId}/days/${dayId}/exercises`, { method: 'POST', body: input });
  },

  updateExercise(clientId: string, planId: string, dayId: string, workoutExerciseId: string, input: Partial<WorkoutExerciseInput>) {
    return apiRequest<WorkoutExerciseDetail>(`${base(clientId)}/${planId}/days/${dayId}/exercises/${workoutExerciseId}`, {
      method: 'PATCH',
      body: input,
    });
  },

  deleteExercise(clientId: string, planId: string, dayId: string, workoutExerciseId: string) {
    return apiRequest<null>(`${base(clientId)}/${planId}/days/${dayId}/exercises/${workoutExerciseId}`, { method: 'DELETE' });
  },

  reorderExercises(clientId: string, planId: string, dayId: string, orderedIds: string[]) {
    return apiRequest<null>(`${base(clientId)}/${planId}/days/${dayId}/exercises/reorder`, { method: 'PATCH', body: { orderedIds } });
  },
};
