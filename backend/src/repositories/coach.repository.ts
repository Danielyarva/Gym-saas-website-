import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface ListCoachesFilters {
  search?: string;
  page: number;
  pageSize: number;
}

export const coachRepository = {
  findByUserId(userId: string) {
    return prisma.coach.findUnique({ where: { userId } });
  },

  /** Platform-wide, admin-only listing (Phase 8) — every other method here is scoped to a single coach's own record. */
  list(filters: ListCoachesFilters) {
    const where: Prisma.CoachWhereInput = filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: 'insensitive' } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
          ],
        }
      : {};

    return Promise.all([
      prisma.coach.findMany({
        where,
        include: {
          user: { select: { email: true, createdAt: true, lastLoginAt: true } },
          subscription: { select: { plan: true } },
          _count: { select: { coachClients: { where: { archivedAt: null } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.coach.count({ where }),
    ]);
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
