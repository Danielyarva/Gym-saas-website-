import { apiRequest } from './api-client';
import type { Exercise, MuscleGroup, EquipmentType, Difficulty } from '@/types';

export interface ListExercisesParams {
  muscleGroup?: MuscleGroup;
  equipment?: EquipmentType;
  difficulty?: Difficulty;
  search?: string;
}

export interface ExerciseInput {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export const exercisesService = {
  list(params: ListExercisesParams) {
    const query = new URLSearchParams();
    if (params.muscleGroup) query.set('muscleGroup', params.muscleGroup);
    if (params.equipment) query.set('equipment', params.equipment);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return apiRequest<Exercise[]>(`/api/exercises${qs ? `?${qs}` : ''}`);
  },

  create(input: ExerciseInput) {
    return apiRequest<Exercise>('/api/exercises', { method: 'POST', body: input });
  },
};
