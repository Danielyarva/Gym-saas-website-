import { z } from 'zod';

function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), schema.optional());
}

export const moodOptions = ['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD'] as const;
export const energyOptions = ['VERY_LOW', 'LOW', 'NEUTRAL', 'GOOD', 'VERY_GOOD'] as const;
export const adherenceOptions = ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'] as const;

export const checkInFormSchema = z.object({
  weightKg: optionalNumber(z.coerce.number().positive().max(500)),
  workoutCompleted: z.boolean().optional(),
  steps: optionalNumber(z.coerce.number().int().min(0).max(100000)),
  sleepHours: optionalNumber(z.coerce.number().min(0).max(24)),
  mood: z.enum(moodOptions).optional(),
  energy: z.enum(energyOptions).optional(),
  nutritionAdherence: z.enum(adherenceOptions).optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  waistCm: optionalNumber(z.coerce.number().positive().max(300)),
  chestCm: optionalNumber(z.coerce.number().positive().max(300)),
  armsCm: optionalNumber(z.coerce.number().positive().max(300)),
  hipsCm: optionalNumber(z.coerce.number().positive().max(300)),
  thighsCm: optionalNumber(z.coerce.number().positive().max(300)),
});
export type CheckInFormValues = z.infer<typeof checkInFormSchema>;
