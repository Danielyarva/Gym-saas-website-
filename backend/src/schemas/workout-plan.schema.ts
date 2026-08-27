import { z } from 'zod';

export const workoutPlanStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

export const planIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
});

export const dayIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  dayId: z.string().uuid(),
});

export const workoutExerciseIdParamSchema = z.object({
  id: z.string().uuid(),
  planId: z.string().uuid(),
  dayId: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
});

export const createWorkoutPlanSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateWorkoutPlanSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  status: workoutPlanStatusEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const createWorkoutDaySchema = z.object({
  label: z.string().trim().min(1).max(80),
  isRestDay: z.boolean().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const updateWorkoutDaySchema = createWorkoutDaySchema.partial();

export const reorderIdsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

export const createWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.coerce.number().int().positive().max(50),
  reps: z.string().trim().min(1).max(20),
  weightKg: z.coerce.number().positive().max(1000).optional(),
  restSeconds: z.coerce.number().int().min(0).max(3600).optional(),
  tempo: z.string().trim().max(20).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const updateWorkoutExerciseSchema = createWorkoutExerciseSchema.partial();

export const markExerciseLogSchema = z.object({
  completed: z.boolean(),
  actualSets: z.coerce.number().int().positive().max(50).optional(),
  actualReps: z.string().trim().max(20).optional(),
  actualWeightKg: z.coerce.number().positive().max(1000).optional(),
});

export const workoutExerciseIdOnlyParamSchema = z.object({
  id: z.string().uuid(),
  workoutExerciseId: z.string().uuid(),
});

export const listWorkoutLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
