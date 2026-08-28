import { prisma } from '../config/prisma';

export interface UpsertWeeklyReportInput {
  overallProgressPct: number | null;
  weightChangeKg: number | null;
  workoutAdherencePct: number | null;
  nutritionAdherencePct: number | null;
  avgSteps: number | null;
  avgSleepHours: number | null;
  wins: string[];
  problems: string[];
  aiSummary: string;
  suggestedActions: string[];
}

export const weeklyReportRepository = {
  /** `(clientId, weekStart)` is unique — regenerating a week updates the existing row rather than duplicating it. */
  upsert(clientId: string, weekStart: Date, weekEnd: Date, input: UpsertWeeklyReportInput) {
    return prisma.weeklyReport.upsert({
      where: { clientId_weekStart: { clientId, weekStart } },
      create: { clientId, weekStart, weekEnd, ...input },
      update: { weekEnd, ...input },
    });
  },

  listForClient(clientId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.weeklyReport.findMany({
        where: { clientId },
        orderBy: { weekStart: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.weeklyReport.count({ where: { clientId } }),
    ]);
  },

  /** The coach's own recent reports across their whole roster, joined through the one-to-one CoachClient relation. */
  listForCoach(coachId: string, page: number, pageSize: number) {
    const where = { client: { coachClient: { coachId } } };
    return Promise.all([
      prisma.weeklyReport.findMany({
        where,
        include: { client: { select: { id: true, fullName: true } } },
        orderBy: { weekStart: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.weeklyReport.count({ where }),
    ]);
  },
};
