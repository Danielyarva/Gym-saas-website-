import type { MoodLevel, EnergyLevel, AdherenceLevel } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CheckInInput {
  weightKg?: number;
  workoutCompleted?: boolean;
  steps?: number;
  sleepHours?: number;
  mood?: MoodLevel;
  energy?: EnergyLevel;
  nutritionAdherence?: AdherenceLevel;
  notes?: string;
}

export interface ListCheckInsFilters {
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export const checkinRepository = {
  findForDate(clientId: string, date: Date) {
    return prisma.dailyCheckIn.findUnique({ where: { clientId_date: { clientId, date } } });
  },

  /** Upserts the check-in and, in the same transaction, keeps CoachClient.lastCheckInAt and (when weight is submitted) ClientProfile.currentWeightKg fresh — the same "hot-path fields stay denormalized" pattern used elsewhere in Phase 1/2. */
  async upsertForDate(clientId: string, date: Date, input: CheckInInput) {
    return prisma.$transaction(async (tx) => {
      const checkIn = await tx.dailyCheckIn.upsert({
        where: { clientId_date: { clientId, date } },
        create: { clientId, date, ...input },
        update: input,
      });

      await tx.coachClient.updateMany({ where: { clientId }, data: { lastCheckInAt: date } });

      if (input.weightKg !== undefined) {
        await tx.clientProfile.update({ where: { clientId }, data: { currentWeightKg: input.weightKg } });
      }

      return checkIn;
    });
  },

  listForClient(clientId: string, filters: ListCheckInsFilters) {
    const where = {
      clientId,
      ...(filters.from || filters.to
        ? { date: { ...(filters.from ? { gte: filters.from } : {}), ...(filters.to ? { lte: filters.to } : {}) } }
        : {}),
    };

    return Promise.all([
      prisma.dailyCheckIn.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
      prisma.dailyCheckIn.count({ where }),
    ]);
  },
};
