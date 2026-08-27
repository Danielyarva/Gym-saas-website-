import type { WorkoutPlanStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface WorkoutPlanInput {
  name: string;
  description?: string;
}

export interface UpdateWorkoutPlanInput {
  name?: string;
  description?: string;
  status?: WorkoutPlanStatus;
  startDate?: Date;
  endDate?: Date;
}

export interface WorkoutDayInput {
  label: string;
  isRestDay?: boolean;
  dayOfWeek?: number;
  notes?: string;
}

export interface WorkoutExerciseInput {
  exerciseId: string;
  sets: number;
  reps: string;
  weightKg?: number;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
}

const planWithDaysInclude = {
  days: {
    orderBy: { order: 'asc' as const },
    include: { exercises: { orderBy: { order: 'asc' as const }, include: { exercise: true } } },
  },
};

export const workoutPlanRepository = {
  listForClient(clientId: string) {
    return prisma.workoutPlan.findMany({ where: { clientId }, orderBy: { createdAt: 'desc' } });
  },

  findById(clientId: string, planId: string) {
    return prisma.workoutPlan.findFirst({ where: { id: planId, clientId }, include: planWithDaysInclude });
  },

  findActiveForClient(clientId: string) {
    return prisma.workoutPlan.findFirst({ where: { clientId, status: 'ACTIVE' }, include: planWithDaysInclude });
  },

  create(coachId: string, clientId: string, input: WorkoutPlanInput) {
    return prisma.workoutPlan.create({ data: { coachId, clientId, ...input } });
  },

  /** Activating a plan archives whatever else was ACTIVE for this client — an app-level invariant (no partial-unique-index in Prisma), enforced in one transaction. */
  async update(clientId: string, planId: string, input: UpdateWorkoutPlanInput) {
    const existing = await prisma.workoutPlan.findFirst({ where: { id: planId, clientId } });
    if (!existing) return null;

    if (input.status === 'ACTIVE') {
      return prisma.$transaction(async (tx) => {
        await tx.workoutPlan.updateMany({ where: { clientId, status: 'ACTIVE', id: { not: planId } }, data: { status: 'ARCHIVED' } });
        return tx.workoutPlan.update({ where: { id: planId }, data: input, include: planWithDaysInclude });
      });
    }

    return prisma.workoutPlan.update({ where: { id: planId }, data: input, include: planWithDaysInclude });
  },

  async delete(clientId: string, planId: string) {
    const existing = await prisma.workoutPlan.findFirst({ where: { id: planId, clientId } });
    if (!existing) return null;
    if (existing.status !== 'DRAFT') return 'NOT_DRAFT' as const;
    await prisma.workoutPlan.delete({ where: { id: planId } });
    return existing;
  },

  async duplicate(clientId: string, planId: string) {
    const original = await prisma.workoutPlan.findFirst({ where: { id: planId, clientId }, include: planWithDaysInclude });
    if (!original) return null;

    return prisma.workoutPlan.create({
      data: {
        coachId: original.coachId,
        clientId: original.clientId,
        name: `${original.name} (copy)`,
        description: original.description,
        status: 'DRAFT',
        days: {
          create: original.days.map((day) => ({
            label: day.label,
            order: day.order,
            isRestDay: day.isRestDay,
            dayOfWeek: day.dayOfWeek,
            notes: day.notes,
            exercises: {
              create: day.exercises.map((we) => ({
                exerciseId: we.exerciseId,
                order: we.order,
                sets: we.sets,
                reps: we.reps,
                weightKg: we.weightKg,
                restSeconds: we.restSeconds,
                tempo: we.tempo,
                notes: we.notes,
              })),
            },
          })),
        },
      },
      include: planWithDaysInclude,
    });
  },
};

export const workoutDayRepository = {
  /** Includes the parent plan so services can verify (planId, clientId) match before allowing any write — the same cross-resource ownership backstop used for client notes. */
  findById(dayId: string) {
    return prisma.workoutDay.findUnique({ where: { id: dayId }, include: { workoutPlan: true } });
  },

  async create(planId: string, input: WorkoutDayInput) {
    const count = await prisma.workoutDay.count({ where: { workoutPlanId: planId } });
    return prisma.workoutDay.create({ data: { workoutPlanId: planId, order: count + 1, ...input } });
  },

  update(dayId: string, input: Partial<WorkoutDayInput>) {
    return prisma.workoutDay.update({ where: { id: dayId }, data: input });
  },

  delete(dayId: string) {
    return prisma.workoutDay.delete({ where: { id: dayId } });
  },

  reorder(orderedDayIds: string[]) {
    return prisma.$transaction(orderedDayIds.map((id, index) => prisma.workoutDay.update({ where: { id }, data: { order: index + 1 } })));
  },
};

export const workoutExerciseRepository = {
  findById(workoutExerciseId: string) {
    return prisma.workoutExercise.findUnique({
      where: { id: workoutExerciseId },
      include: { workoutDay: { include: { workoutPlan: true } } },
    });
  },

  async create(dayId: string, input: WorkoutExerciseInput) {
    const count = await prisma.workoutExercise.count({ where: { workoutDayId: dayId } });
    return prisma.workoutExercise.create({ data: { workoutDayId: dayId, order: count + 1, ...input }, include: { exercise: true } });
  },

  update(workoutExerciseId: string, input: Partial<WorkoutExerciseInput>) {
    return prisma.workoutExercise.update({ where: { id: workoutExerciseId }, data: input, include: { exercise: true } });
  },

  delete(workoutExerciseId: string) {
    return prisma.workoutExercise.delete({ where: { id: workoutExerciseId } });
  },

  reorder(orderedExerciseIds: string[]) {
    return prisma.$transaction(
      orderedExerciseIds.map((id, index) => prisma.workoutExercise.update({ where: { id }, data: { order: index + 1 } })),
    );
  },
};
