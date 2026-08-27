import { prisma } from '../config/prisma';

export const workoutLogRepository = {
  findForDate(clientId: string, workoutDayId: string, date: Date) {
    return prisma.workoutLog.findUnique({
      where: { clientId_workoutDayId_date: { clientId, workoutDayId, date } },
      include: { exerciseLogs: true },
    });
  },

  findOrCreateForDate(clientId: string, workoutDayId: string, date: Date) {
    return prisma.workoutLog.upsert({
      where: { clientId_workoutDayId_date: { clientId, workoutDayId, date } },
      create: { clientId, workoutDayId, date, status: 'IN_PROGRESS' },
      update: {},
      include: { exerciseLogs: true },
    });
  },

  markStatus(workoutLogId: string, status: 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED') {
    return prisma.workoutLog.update({
      where: { id: workoutLogId },
      data: { status, completedAt: status === 'COMPLETED' ? new Date() : null },
    });
  },

  /** Most recent log per distinct workout day, used to find "the next unlogged day in sequence" when a plan has no fixed weekly schedule. */
  listRecentForClient(clientId: string, limit: number) {
    return prisma.workoutLog.findMany({ where: { clientId }, orderBy: { date: 'desc' }, take: limit });
  },

  listForClient(clientId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.workoutLog.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { workoutDay: { select: { label: true } } },
      }),
      prisma.workoutLog.count({ where: { clientId } }),
    ]);
  },
};

export const exerciseLogRepository = {
  upsert(workoutLogId: string, workoutExerciseId: string, data: { completed: boolean; actualSets?: number; actualReps?: string; actualWeightKg?: number }) {
    return prisma.exerciseLog.upsert({
      where: { workoutLogId_workoutExerciseId: { workoutLogId, workoutExerciseId } },
      create: { workoutLogId, workoutExerciseId, ...data, completedAt: data.completed ? new Date() : null },
      update: { ...data, completedAt: data.completed ? new Date() : null },
    });
  },
};
