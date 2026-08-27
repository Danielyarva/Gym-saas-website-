import type { GoalType } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface UpsertPrimaryGoalInput {
  type: GoalType;
  targetValue?: number;
  targetUnit?: string;
  targetDate?: Date;
  notes?: string;
}

export const goalRepository = {
  listForClient(clientId: string) {
    return prisma.goal.findMany({ where: { clientId }, orderBy: { createdAt: 'asc' } });
  },

  findPrimary(clientId: string) {
    return prisma.goal.findFirst({ where: { clientId, isPrimary: true } });
  },

  /**
   * Onboarding step 2 captures exactly one primary goal (the Goal model
   * supports many per client for future use, but the wizard only needs one).
   * Re-visiting this step before completing onboarding updates that same
   * row instead of creating duplicates.
   */
  async upsertPrimary(clientId: string, data: UpsertPrimaryGoalInput) {
    const existing = await prisma.goal.findFirst({ where: { clientId, isPrimary: true } });

    if (existing) {
      return prisma.goal.update({ where: { id: existing.id }, data });
    }
    return prisma.goal.create({ data: { ...data, clientId, isPrimary: true } });
  },
};
