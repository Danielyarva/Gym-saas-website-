import { z } from 'zod';

export const muscleGroupEnum = z.enum(['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY', 'OTHER']);
export const equipmentTypeEnum = z.enum(['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'BAND', 'OTHER']);
export const difficultyEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const listExercisesQuerySchema = z.object({
  muscleGroup: muscleGroupEnum.optional(),
  equipment: equipmentTypeEnum.optional(),
  difficulty: difficultyEnum.optional(),
  search: z.string().trim().max(200).optional(),
});

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: muscleGroupEnum,
  equipment: equipmentTypeEnum,
  difficulty: difficultyEnum,
  instructions: z.string().trim().max(2000).optional(),
  videoUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const exerciseIdParamSchema = z.object({
  exerciseId: z.string().uuid(),
});
