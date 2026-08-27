import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

// Only ever called with plain scalar field values from onboarding.service.ts
// (never Prisma's {set: ...} update-operation wrappers), so it's typed
// against the plain create shape rather than the update type, which would
// otherwise also (incorrectly) allow those wrapper objects here.
type OnboardingStepFields = Partial<Omit<Prisma.ClientOnboardingUncheckedCreateInput, 'id' | 'clientId' | 'currentStep' | 'createdAt' | 'updatedAt'>>;

export const onboardingRepository = {
  findByClientId(clientId: string) {
    return prisma.clientOnboarding.findUnique({ where: { clientId } });
  },

  /** Creates the row on first save; every later step is a partial update against the same row. */
  upsertStepData(clientId: string, currentStep: number, data: OnboardingStepFields) {
    return prisma.clientOnboarding.upsert({
      where: { clientId },
      create: { clientId, currentStep, ...data },
      update: { currentStep, ...data },
    });
  },

  markCompleted(clientId: string) {
    return prisma.clientOnboarding.update({ where: { clientId }, data: { completedAt: new Date() } });
  },
};
