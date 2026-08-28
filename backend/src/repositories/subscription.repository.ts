import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface UpdateSubscriptionInput {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  currentPeriodEnd?: Date | null;
  razorpayOrderId?: string | null;
}

export const subscriptionRepository = {
  /** Created once alongside the Coach row on registration — every coach has exactly one Starter subscription from day one, never a missing row to null-check elsewhere. */
  create(coachId: string) {
    return prisma.subscription.create({ data: { coachId } });
  },

  findByCoachId(coachId: string) {
    return prisma.subscription.findUnique({ where: { coachId } });
  },

  update(coachId: string, input: UpdateSubscriptionInput) {
    return prisma.subscription.update({ where: { coachId }, data: input });
  },
};
