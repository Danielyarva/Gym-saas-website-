import { z } from 'zod';

// HTML inputs submit "" for an empty optional field, never undefined —
// z.coerce.number()/z.coerce.date() on "" produce 0 / Invalid Date rather
// than passing .optional() through, so every optional numeric/date field
// needs this normalization first (same fix as schemas/client.schema.ts).
function optionalNumber<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), schema.optional());
}
function optionalDate() {
  return z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : value), z.coerce.date().optional());
}

export const goalTypeOptions = ['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'MOBILITY', 'GENERAL_FITNESS', 'OTHER'] as const;
export const trainingExperienceOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;
export const activityLevelOptions = ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE'] as const;
export const sleepQualityOptions = ['POOR', 'FAIR', 'GOOD', 'EXCELLENT'] as const;

export const basicInfoStepSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your name').max(120),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  dateOfBirth: optionalDate(),
  gender: z.string().trim().max(50).optional().or(z.literal('')),
  heightCm: optionalNumber(z.coerce.number().positive().max(300)),
});
export type BasicInfoStepValues = z.infer<typeof basicInfoStepSchema>;

export const goalStepSchema = z.object({
  type: z.enum(goalTypeOptions),
  targetValue: optionalNumber(z.coerce.number()),
  targetUnit: z.string().trim().max(20).optional().or(z.literal('')),
  targetDate: optionalDate(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type GoalStepValues = z.infer<typeof goalStepSchema>;

export const bodyMeasurementsStepSchema = z.object({
  weightKg: optionalNumber(z.coerce.number().positive().max(500)),
  waistCm: optionalNumber(z.coerce.number().positive().max(300)),
  chestCm: optionalNumber(z.coerce.number().positive().max(300)),
  armsCm: optionalNumber(z.coerce.number().positive().max(300)),
  hipsCm: optionalNumber(z.coerce.number().positive().max(300)),
  thighsCm: optionalNumber(z.coerce.number().positive().max(300)),
});
export type BodyMeasurementsStepValues = z.infer<typeof bodyMeasurementsStepSchema>;

export const trainingExperienceStepSchema = z.object({
  trainingExperience: z.enum(trainingExperienceOptions).optional(),
  trainingDaysPerWeek: optionalNumber(z.coerce.number().int().min(0).max(7)),
});
export type TrainingExperienceStepValues = z.infer<typeof trainingExperienceStepSchema>;

export const equipmentStepSchema = z.object({
  equipmentList: z.array(z.string()).max(30).optional(),
  equipmentNotes: z.string().trim().max(500).optional().or(z.literal('')),
});
export type EquipmentStepValues = z.infer<typeof equipmentStepSchema>;

export const nutritionPreferencesStepSchema = z.object({
  dietaryPreferences: z.array(z.string()).max(20).optional(),
  allergies: z.array(z.string()).max(20).optional(),
  mealsPerDayPreference: optionalNumber(z.coerce.number().int().min(1).max(10)),
});
export type NutritionPreferencesStepValues = z.infer<typeof nutritionPreferencesStepSchema>;

export const lifestyleStepSchema = z.object({
  activityLevel: z.enum(activityLevelOptions).optional(),
  occupationType: z.string().trim().max(100).optional().or(z.literal('')),
  stressLevel: optionalNumber(z.coerce.number().int().min(1).max(5)),
});
export type LifestyleStepValues = z.infer<typeof lifestyleStepSchema>;

export const sleepStepSchema = z.object({
  typicalSleepHours: optionalNumber(z.coerce.number().min(0).max(24)),
  sleepQuality: z.enum(sleepQualityOptions).optional(),
});
export type SleepStepValues = z.infer<typeof sleepStepSchema>;

export const medicalSafetyStepSchema = z.object({
  injuriesOrLimitations: z.string().trim().max(1000).optional().or(z.literal('')),
  clearedForExercise: z.boolean().optional(),
});
export type MedicalSafetyStepValues = z.infer<typeof medicalSafetyStepSchema>;
