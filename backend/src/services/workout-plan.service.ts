import type { Request } from 'express';
import {
  workoutPlanRepository,
  workoutDayRepository,
  workoutExerciseRepository,
  type WorkoutPlanInput,
  type UpdateWorkoutPlanInput,
  type WorkoutDayInput,
  type WorkoutExerciseInput,
} from '../repositories/workout-plan.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function toPublicExercise(we: {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weightKg: unknown;
  restSeconds: number | null;
  tempo: string | null;
  notes: string | null;
  exercise: { id: string; name: string; muscleGroup: string; equipment: string; difficulty: string; instructions: string | null; videoUrl: string | null; imageUrl: string | null };
}) {
  return {
    id: we.id,
    order: we.order,
    sets: we.sets,
    reps: we.reps,
    weightKg: toNumberOrNull(we.weightKg),
    restSeconds: we.restSeconds,
    tempo: we.tempo,
    notes: we.notes,
    exercise: we.exercise,
  };
}

function toPublicDay(day: { id: string; label: string; order: number; isRestDay: boolean; dayOfWeek: number | null; notes: string | null; exercises: Parameters<typeof toPublicExercise>[0][] }) {
  return {
    id: day.id,
    label: day.label,
    order: day.order,
    isRestDay: day.isRestDay,
    dayOfWeek: day.dayOfWeek,
    notes: day.notes,
    exercises: day.exercises.map(toPublicExercise),
  };
}

function toPublicPlan(plan: {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  days: Parameters<typeof toPublicDay>[0][];
}) {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    createdAt: plan.createdAt,
    days: plan.days.map(toPublicDay),
  };
}

async function list(clientId: string) {
  return workoutPlanRepository.listForClient(clientId);
}

async function getById(clientId: string, planId: string) {
  const plan = await workoutPlanRepository.findById(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Workout plan not found');
  return toPublicPlan(plan);
}

async function create(coachId: string, clientId: string, input: WorkoutPlanInput) {
  const plan = await workoutPlanRepository.create(coachId, clientId, input);
  return getById(clientId, plan.id);
}

async function update(clientId: string, planId: string, input: UpdateWorkoutPlanInput, req: Request) {
  const result = await workoutPlanRepository.update(clientId, planId, input);
  if (!result) throw new AppError('NOT_FOUND', 'Workout plan not found');

  if (input.status === 'ACTIVE') {
    await auditService.log({ req, actorUserId: req.user?.id, action: 'WORKOUT_PLAN_ASSIGNED', entityType: 'CLIENT', entityId: clientId, metadata: { planId } });
  }

  return toPublicPlan(result);
}

async function remove(clientId: string, planId: string) {
  const result = await workoutPlanRepository.delete(clientId, planId);
  if (result === null) throw new AppError('NOT_FOUND', 'Workout plan not found');
  if (result === 'NOT_DRAFT') throw new AppError('VALIDATION_ERROR', 'Only draft plans can be deleted — archive it instead');
}

async function duplicate(clientId: string, planId: string) {
  const plan = await workoutPlanRepository.duplicate(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Workout plan not found');
  return toPublicPlan(plan);
}

async function assertPlanBelongsToClient(clientId: string, planId: string) {
  const plan = await workoutPlanRepository.findById(clientId, planId);
  if (!plan) throw new AppError('NOT_FOUND', 'Workout plan not found');
  return plan;
}

async function assertDayBelongsToPlan(clientId: string, planId: string, dayId: string) {
  const day = await workoutDayRepository.findById(dayId);
  if (!day || day.workoutPlan.clientId !== clientId || day.workoutPlanId !== planId) {
    throw new AppError('NOT_FOUND', 'Workout day not found');
  }
  return day;
}

async function assertExerciseBelongsToChain(clientId: string, planId: string, dayId: string, workoutExerciseId: string) {
  const we = await workoutExerciseRepository.findById(workoutExerciseId);
  if (!we || we.workoutDay.workoutPlan.clientId !== clientId || we.workoutDay.workoutPlanId !== planId || we.workoutDayId !== dayId) {
    throw new AppError('NOT_FOUND', 'Exercise not found on this workout day');
  }
  return we;
}

async function createDay(clientId: string, planId: string, input: WorkoutDayInput) {
  await assertPlanBelongsToClient(clientId, planId);
  return workoutDayRepository.create(planId, input);
}

async function updateDay(clientId: string, planId: string, dayId: string, input: Partial<WorkoutDayInput>) {
  await assertDayBelongsToPlan(clientId, planId, dayId);
  return workoutDayRepository.update(dayId, input);
}

async function deleteDay(clientId: string, planId: string, dayId: string) {
  await assertDayBelongsToPlan(clientId, planId, dayId);
  await workoutDayRepository.delete(dayId);
}

async function reorderDays(clientId: string, planId: string, orderedDayIds: string[]) {
  await Promise.all(orderedDayIds.map((dayId) => assertDayBelongsToPlan(clientId, planId, dayId)));
  await workoutDayRepository.reorder(orderedDayIds);
}

async function createExercise(clientId: string, planId: string, dayId: string, input: WorkoutExerciseInput) {
  await assertDayBelongsToPlan(clientId, planId, dayId);
  return workoutExerciseRepository.create(dayId, input);
}

async function updateExercise(clientId: string, planId: string, dayId: string, workoutExerciseId: string, input: Partial<WorkoutExerciseInput>) {
  await assertExerciseBelongsToChain(clientId, planId, dayId, workoutExerciseId);
  return workoutExerciseRepository.update(workoutExerciseId, input);
}

async function deleteExercise(clientId: string, planId: string, dayId: string, workoutExerciseId: string) {
  await assertExerciseBelongsToChain(clientId, planId, dayId, workoutExerciseId);
  await workoutExerciseRepository.delete(workoutExerciseId);
}

async function reorderExercises(clientId: string, planId: string, dayId: string, orderedExerciseIds: string[]) {
  await Promise.all(orderedExerciseIds.map((weId) => assertExerciseBelongsToChain(clientId, planId, dayId, weId)));
  await workoutExerciseRepository.reorder(orderedExerciseIds);
}

export const workoutPlanService = {
  list,
  getById,
  create,
  update,
  remove,
  duplicate,
  createDay,
  updateDay,
  deleteDay,
  reorderDays,
  createExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
};
