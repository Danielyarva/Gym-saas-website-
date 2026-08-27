import { prisma } from '../config/prisma';

export const coachRepository = {
  findByUserId(userId: string) {
    return prisma.coach.findUnique({ where: { userId } });
  },

  findById(id: string) {
    return prisma.coach.findUnique({ where: { id } });
  },

  create(data: { userId: string; fullName: string }) {
    return prisma.coach.create({ data });
  },
};
