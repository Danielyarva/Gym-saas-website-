import { prisma } from '../config/prisma';

export const coachRepository = {
  findByUserId(userId: string) {
    return prisma.coach.findUnique({ where: { userId } });
  },

  findById(id: string) {
    return prisma.coach.findUnique({ where: { id } });
  },

  /** For payment receipts/subscription notifications, which need the coach's account email (User.email), not just the Coach row. */
  findByIdWithUser(id: string) {
    return prisma.coach.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
  },

  create(data: { userId: string; fullName: string }) {
    return prisma.coach.create({ data });
  },
};
