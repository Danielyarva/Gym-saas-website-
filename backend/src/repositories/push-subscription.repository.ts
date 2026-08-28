import { prisma } from '../config/prisma';

export const pushSubscriptionRepository = {
  /** Upsert on endpoint: re-subscribing the same browser (e.g. after re-granting permission) updates the row instead of creating a duplicate. */
  create(userId: string, endpoint: string, p256dh: string, auth: string) {
    return prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth },
      update: { userId, p256dh, auth },
    });
  },

  listForUser(userId: string) {
    return prisma.pushSubscription.findMany({ where: { userId } });
  },

  /** Scoped to userId — a user may only ever remove their own subscription, never one they merely know the endpoint of. */
  deleteByEndpoint(userId: string, endpoint: string) {
    return prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  },
};
