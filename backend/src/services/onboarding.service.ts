import type { z } from 'zod';
import { onboardingRepository } from '../repositories/onboarding.repository';
import { goalRepository } from '../repositories/goal.repository';
import { bodyMeasurementRepository } from '../repositories/body-measurement.repository';
import { clientRepository } from '../repositories/client.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';
import {
  ONBOARDING_STEP_SCHEMAS,
  basicInfoStepSchema,
  goalStepSchema,
  bodyMeasurementsStepSchema,
} from '../schemas/onboarding.schema';
import type { Request } from 'express';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

async function getOnboarding(clientId: string) {
  const [client, onboarding, goal, bodyMeasurement] = await Promise.all([
    clientRepository.findOwnProfile(clientId),
    onboardingRepository.findByClientId(clientId),
    goalRepository.findPrimary(clientId),
    bodyMeasurementRepository.findLatest(clientId),
  ]);

  if (!client) throw new AppError('NOT_FOUND', 'Client not found');

  return {
    basicInfo: {
      fullName: client.fullName,
      phone: client.phone,
      email: client.email,
      dateOfBirth: client.profile?.dateOfBirth ?? null,
      gender: client.profile?.gender ?? null,
      heightCm: toNumberOrNull(client.profile?.heightCm),
    },
    goal: goal
      ? { type: goal.type, targetValue: toNumberOrNull(goal.targetValue), targetUnit: goal.targetUnit, targetDate: goal.targetDate, notes: goal.notes }
      : null,
    bodyMeasurement: bodyMeasurement
      ? {
          weightKg: toNumberOrNull(bodyMeasurement.weightKg),
          waistCm: toNumberOrNull(bodyMeasurement.waistCm),
          chestCm: toNumberOrNull(bodyMeasurement.chestCm),
          armsCm: toNumberOrNull(bodyMeasurement.armsCm),
          hipsCm: toNumberOrNull(bodyMeasurement.hipsCm),
          thighsCm: toNumberOrNull(bodyMeasurement.thighsCm),
        }
      : null,
    trainingExperience: onboarding?.trainingExperience ?? null,
    trainingDaysPerWeek: onboarding?.trainingDaysPerWeek ?? null,
    equipmentList: onboarding?.equipmentList ?? [],
    equipmentNotes: onboarding?.equipmentNotes ?? null,
    dietaryPreferences: onboarding?.dietaryPreferences ?? [],
    allergies: onboarding?.allergies ?? [],
    mealsPerDayPreference: onboarding?.mealsPerDayPreference ?? null,
    activityLevel: onboarding?.activityLevel ?? null,
    occupationType: onboarding?.occupationType ?? null,
    stressLevel: onboarding?.stressLevel ?? null,
    typicalSleepHours: toNumberOrNull(onboarding?.typicalSleepHours),
    sleepQuality: onboarding?.sleepQuality ?? null,
    injuriesOrLimitations: onboarding?.injuriesOrLimitations ?? null,
    clearedForExercise: onboarding?.clearedForExercise ?? null,
    needsMedicalClearance: onboarding?.needsMedicalClearance ?? false,
    currentStep: onboarding?.currentStep ?? 1,
    completedAt: onboarding?.completedAt ?? null,
  };
}

async function saveStep(clientId: string, stepNumber: number, body: unknown) {
  const schema = ONBOARDING_STEP_SCHEMAS[stepNumber as keyof typeof ONBOARDING_STEP_SCHEMAS];
  if (!schema) throw new AppError('VALIDATION_ERROR', 'Invalid onboarding step');

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError('VALIDATION_ERROR', 'Invalid request', result.error.flatten().fieldErrors);
  }

  // Steps 1-3 write into existing Client/ClientProfile/Goal/BodyMeasurement
  // tables (per the Phase 2 plan); steps 4-9 write straight into
  // ClientOnboarding. currentStep only ever moves forward — editing an
  // earlier step after progressing past it doesn't regress the wizard.
  const existing = await onboardingRepository.findByClientId(clientId);
  const nextStep = Math.max(existing?.currentStep ?? 1, stepNumber + 1);

  if (stepNumber === 1) {
    const data = result.data as z.infer<typeof basicInfoStepSchema>;
    await clientRepository.updateOwnBasicInfo(clientId, data);
  } else if (stepNumber === 2) {
    const data = result.data as z.infer<typeof goalStepSchema>;
    await goalRepository.upsertPrimary(clientId, data);
  } else if (stepNumber === 3) {
    const data = result.data as z.infer<typeof bodyMeasurementsStepSchema>;
    await bodyMeasurementRepository.upsertOnboardingSnapshot(clientId, data);
    if (data.weightKg !== undefined) {
      await clientRepository.updateOwnStartingWeight(clientId, data.weightKg);
    }
  }

  // Steps 4-9 (and the bookkeeping currentStep bump for every step) always
  // land in ClientOnboarding — steps 1-3 above also touch it just to record
  // progress, since their real data lives elsewhere. Step schemas 4-9 use
  // the same field names as ClientOnboarding, so the parsed data is already
  // shaped correctly for the update.
  const onboardingFields = stepNumber >= 4 ? (result.data as Record<string, unknown>) : {};
  await onboardingRepository.upsertStepData(clientId, nextStep, onboardingFields);

  return getOnboarding(clientId);
}

async function complete(clientId: string, req: Request) {
  const [client, goal] = await Promise.all([clientRepository.findOwnProfile(clientId), goalRepository.findPrimary(clientId)]);

  if (!client?.profile?.dateOfBirth || !goal) {
    throw new AppError('VALIDATION_ERROR', 'Complete the basic information and goals steps before finishing onboarding');
  }

  const result = await onboardingRepository.markCompleted(clientId);
  await auditService.log({ req, actorUserId: req.user?.id, action: 'ONBOARDING_COMPLETED', entityType: 'CLIENT', entityId: clientId });

  return { completedAt: result.completedAt };
}

export const onboardingService = {
  getOnboarding,
  saveStep,
  complete,
};
