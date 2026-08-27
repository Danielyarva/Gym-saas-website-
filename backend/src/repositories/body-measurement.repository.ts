import { prisma } from '../config/prisma';

export interface UpsertOnboardingMeasurementInput {
  weightKg?: number;
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  hipsCm?: number;
  thighsCm?: number;
}

export const bodyMeasurementRepository = {
  findLatest(clientId: string) {
    return prisma.bodyMeasurement.findFirst({ where: { clientId }, orderBy: { recordedAt: 'desc' } });
  },

  /** Onboarding step 3 writes one baseline snapshot; re-visiting the step updates it rather than creating a new time-series entry. */
  async upsertOnboardingSnapshot(clientId: string, data: UpsertOnboardingMeasurementInput) {
    const existing = await prisma.bodyMeasurement.findFirst({ where: { clientId, source: 'ONBOARDING' } });

    if (existing) {
      return prisma.bodyMeasurement.update({ where: { id: existing.id }, data });
    }
    return prisma.bodyMeasurement.create({ data: { ...data, clientId, source: 'ONBOARDING' } });
  },
};
