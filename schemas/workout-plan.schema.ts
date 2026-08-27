import { z } from 'zod';

function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), schema.optional());
}

export const muscleGroupOptions = ['CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY', 'OTHER'] as const;
export const equipmentOptions = ['BARBELL', 'DUMBBELL', 'MACHINE', 'CABLE', 'BODYWEIGHT', 'KETTLEBELL', 'BAND', 'OTHER'] as const;
export const difficultyOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export const createPlanFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a plan name').max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});
export type CreatePlanFormValues = z.infer<typeof createPlanFormSchema>;

export const dayFormSchema = z.object({
  label: z.string().trim().min(1, 'Enter a day label').max(80),
  isRestDay: z.boolean().optional(),
  dayOfWeek: optionalNumber(z.coerce.number().int().min(0).max(6)),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});
export type DayFormValues = z.infer<typeof dayFormSchema>;

export const customExerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter an exercise name').max(120),
  muscleGroup: z.enum(muscleGroupOptions),
  equipment: z.enum(equipmentOptions),
  difficulty: z.enum(difficultyOptions),
});
export type CustomExerciseFormValues = z.infer<typeof customExerciseFormSchema>;

export const workoutExerciseFormSchema = z.object({
  sets: z.coerce.number().int().positive().max(50),
  reps: z.string().trim().min(1, 'Enter reps, e.g. 8-12').max(20),
  weightKg: optionalNumber(z.coerce.number().positive().max(1000)),
  restSeconds: optionalNumber(z.coerce.number().int().min(0).max(3600)),
  tempo: z.string().trim().max(20).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type WorkoutExerciseFormValues = z.infer<typeof workoutExerciseFormSchema>;
