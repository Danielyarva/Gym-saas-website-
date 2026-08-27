import { z } from 'zod';

const goalTypeEnum = z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'ENDURANCE', 'STRENGTH', 'MOBILITY', 'GENERAL_FITNESS', 'OTHER']);
const trainingExperienceEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
const activityLevelEnum = z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE']);
const sleepQualityEnum = z.enum(['POOR', 'FAIR', 'GOOD', 'EXCELLENT']);

export const basicInfoStepSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().trim().max(50).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
});

export const goalStepSchema = z.object({
  type: goalTypeEnum,
  targetValue: z.coerce.number().optional(),
  targetUnit: z.string().trim().max(20).optional(),
  targetDate: z.coerce.date().optional(),
  notes: z.string().trim().max(500).optional(),
});

export const bodyMeasurementsStepSchema = z.object({
  weightKg: z.coerce.number().positive().max(500).optional(),
  waistCm: z.coerce.number().positive().max(300).optional(),
  chestCm: z.coerce.number().positive().max(300).optional(),
  armsCm: z.coerce.number().positive().max(300).optional(),
  hipsCm: z.coerce.number().positive().max(300).optional(),
  thighsCm: z.coerce.number().positive().max(300).optional(),
});

export const trainingExperienceStepSchema = z.object({
  trainingExperience: trainingExperienceEnum.optional(),
  trainingDaysPerWeek: z.coerce.number().int().min(0).max(7).optional(),
});

export const equipmentStepSchema = z.object({
  equipmentList: z.array(z.string().trim().max(50)).max(30).optional(),
  equipmentNotes: z.string().trim().max(500).optional(),
});

export const nutritionPreferencesStepSchema = z.object({
  dietaryPreferences: z.array(z.string().trim().max(50)).max(20).optional(),
  allergies: z.array(z.string().trim().max(50)).max(20).optional(),
  mealsPerDayPreference: z.coerce.number().int().min(1).max(10).optional(),
});

export const lifestyleStepSchema = z.object({
  activityLevel: activityLevelEnum.optional(),
  occupationType: z.string().trim().max(100).optional(),
  stressLevel: z.coerce.number().int().min(1).max(5).optional(),
});

export const sleepStepSchema = z.object({
  typicalSleepHours: z.coerce.number().min(0).max(24).optional(),
  sleepQuality: sleepQualityEnum.optional(),
});

export const medicalSafetyStepSchema = z.object({
  injuriesOrLimitations: z.string().trim().max(1000).optional(),
  clearedForExercise: z.boolean().optional(),
});

// One schema per step, keyed by step number — the single source of truth
// for both validating PATCH /onboarding/step/:stepNumber and for the
// frontend wizard knowing how many steps exist (steps 1-9; step 10 is the
// review screen and submits POST /onboarding/complete instead).
export const ONBOARDING_STEP_SCHEMAS = {
  1: basicInfoStepSchema,
  2: goalStepSchema,
  3: bodyMeasurementsStepSchema,
  4: trainingExperienceStepSchema,
  5: equipmentStepSchema,
  6: nutritionPreferencesStepSchema,
  7: lifestyleStepSchema,
  8: sleepStepSchema,
  9: medicalSafetyStepSchema,
} as const;

export const ONBOARDING_TOTAL_STEPS = 10;

export const stepNumberParamSchema = z.object({
  id: z.string().uuid(),
  stepNumber: z.coerce.number().int().min(1).max(9),
});
