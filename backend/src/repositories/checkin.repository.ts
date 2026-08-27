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

export interface BodyMeasurementInput {
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  hipsCm?: number;
  thighsCm?: number;
}

export interface ListCheckInsFilters {
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

function weightProgressPct(startingWeightKg: number, currentWeightKg: number, goalWeightKg: number): number {
  if (startingWeightKg === goalWeightKg) return 100;
  const total = Math.abs(goalWeightKg - startingWeightKg);
  const covered = Math.abs(currentWeightKg - startingWeightKg);
  return Math.max(0, Math.min(100, Math.round((covered / total) * 100)));
}

export const checkinRepository = {
  findForDate(clientId: string, date: Date) {
    return prisma.dailyCheckIn.findUnique({ where: { clientId_date: { clientId, date } } });
  },

  /**
   * Upserts the check-in and, in the same transaction: keeps
   * CoachClient.lastCheckInAt fresh; upserts a same-day BodyMeasurement
   * (source: CHECK_IN) when any measurement beyond weight is submitted,
   * rather than creating a new row on every resubmit; updates
   * ClientProfile.currentWeightKg when weight is submitted; and recomputes
   * CoachClient.adherencePct/progressPct from scratch every time so they
   * never go stale — these two fields have been dead (always null) since
   * Phase 1, this is what finally populates them.
   */
  async upsertForDate(clientId: string, date: Date, input: CheckInInput, measurements: BodyMeasurementInput, adherenceWindowStart: Date) {
    return prisma.$transaction(async (tx) => {
      const checkIn = await tx.dailyCheckIn.upsert({
        where: { clientId_date: { clientId, date } },
        create: { clientId, date, ...input },
        update: input,
      });

      await tx.coachClient.updateMany({ where: { clientId }, data: { lastCheckInAt: date } });

      const hasMeasurements = Object.values(measurements).some((value) => value !== undefined);
      if (hasMeasurements) {
        const existing = await tx.bodyMeasurement.findFirst({ where: { clientId, recordedAt: date, source: 'CHECK_IN' } });
        if (existing) {
          await tx.bodyMeasurement.update({ where: { id: existing.id }, data: measurements });
        } else {
          await tx.bodyMeasurement.create({ data: { clientId, recordedAt: date, source: 'CHECK_IN', ...measurements } });
        }
      }

      if (input.weightKg !== undefined) {
        await tx.clientProfile.update({ where: { clientId }, data: { currentWeightKg: input.weightKg } });
      }

      const [totalCheckIns, completedCheckIns, profile] = await Promise.all([
        tx.dailyCheckIn.count({ where: { clientId, date: { gte: adherenceWindowStart } } }),
        tx.dailyCheckIn.count({ where: { clientId, date: { gte: adherenceWindowStart }, workoutCompleted: true } }),
        tx.clientProfile.findUnique({ where: { clientId } }),
      ]);

      const adherencePct = totalCheckIns > 0 ? Math.round((completedCheckIns / totalCheckIns) * 100) : null;
      const progressPct =
        profile?.startingWeightKg != null && profile?.currentWeightKg != null && profile?.goalWeightKg != null
          ? weightProgressPct(Number(profile.startingWeightKg), Number(profile.currentWeightKg), Number(profile.goalWeightKg))
          : null;

      await tx.coachClient.updateMany({ where: { clientId }, data: { adherencePct, progressPct } });

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

  /** Raw, oldest-first rows for the progress-charts endpoint — no pagination, callers plot the whole range. */
  listInRange(clientId: string, from?: Date) {
    return prisma.dailyCheckIn.findMany({
      where: { clientId, ...(from ? { date: { gte: from } } : {}) },
      orderBy: { date: 'asc' },
    });
  },
};
