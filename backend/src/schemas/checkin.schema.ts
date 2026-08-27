import { z } from 'zod';

export const moodEnum = z.enum(['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD']);
export const energyEnum = z.enum(['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD']);
export const adherenceEnum = z.enum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']);

export const submitCheckInSchema = z.object({
  date: z.coerce.date().optional(),
  weightKg: z.coerce.number().positive().max(500).optional(),
  workoutCompleted: z.boolean().optional(),
  steps: z.coerce.number().int().min(0).max(100000).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  mood: moodEnum.optional(),
  energy: energyEnum.optional(),
  nutritionAdherence: adherenceEnum.optional(),
  notes: z.string().trim().max(1000).optional(),
  // Optional periodic body measurements (Phase 3) — when any are present,
  // the service also upserts a same-day BodyMeasurement row (source: CHECK_IN).
  waistCm: z.coerce.number().positive().max(300).optional(),
  chestCm: z.coerce.number().positive().max(300).optional(),
  armsCm: z.coerce.number().positive().max(300).optional(),
  hipsCm: z.coerce.number().positive().max(300).optional(),
  thighsCm: z.coerce.number().positive().max(300).optional(),
});

export const listCheckInsQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
