import { workoutPlanRepository, workoutExerciseRepository } from '../repositories/workout-plan.repository';
import { workoutLogRepository, exerciseLogRepository } from '../repositories/workout-log.repository';
import { AppError } from '../utils/app-error';
import { todayDateOnly } from '../utils/date';

type PlanWithDays = NonNullable<Awaited<ReturnType<typeof workoutPlanRepository.findActiveForClient>>>;
type DayWithExercises = PlanWithDays['days'][number];

/**
 * Resolves "today's" WorkoutDay for a plan with no rigid calendar (Phase 2 has
 * no full periodization scheduler): prefer a day pinned to today's weekday
 * (0=Sun..6=Sat); otherwise fall back to "the day after whichever day was
 * most recently logged," wrapping back to the first day once the cycle ends.
 */
async function resolveTodayDay(clientId: string, plan: PlanWithDays): Promise<DayWithExercises | null> {
  const trainingDays = plan.days.filter((d) => !d.isRestDay);
  if (trainingDays.length === 0) return null;

  const todayWeekday = new Date().getUTCDay();
  const pinned = plan.days.find((d) => d.dayOfWeek === todayWeekday);
  if (pinned) return pinned;

  const anyPinned = plan.days.some((d) => d.dayOfWeek !== null);
  if (anyPinned) return null;

  const recentLogs = await workoutLogRepository.listRecentForClient(clientId, 5);
  const lastLoggedDayId = recentLogs[0]?.workoutDayId;
  if (!lastLoggedDayId) return trainingDays[0]!;

  const lastIndex = trainingDays.findIndex((d) => d.id === lastLoggedDayId);
  if (lastIndex === -1) return trainingDays[0]!;

  return trainingDays[(lastIndex + 1) % trainingDays.length]!;
}

async function getToday(clientId: string) {
  const plan = await workoutPlanRepository.findActiveForClient(clientId);
  if (!plan) throw new AppError('PLAN_NOT_ACTIVE', 'No active workout plan');

  const day = await resolveTodayDay(clientId, plan);
  if (!day) {
    return { plan: { id: plan.id, name: plan.name }, day: null, log: null };
  }

  const date = todayDateOnly();
  const log = await workoutLogRepository.findOrCreateForDate(clientId, day.id, date);

  const completedByExerciseId = new Map(log.exerciseLogs.map((el) => [el.workoutExerciseId, el]));

  return {
    plan: { id: plan.id, name: plan.name },
    day: {
      id: day.id,
      label: day.label,
      notes: day.notes,
      exercises: day.exercises.map((we) => ({
        id: we.id,
        order: we.order,
        sets: we.sets,
        reps: we.reps,
        weightKg: we.weightKg === null ? null : Number(we.weightKg),
        restSeconds: we.restSeconds,
        tempo: we.tempo,
        notes: we.notes,
        exercise: we.exercise,
        log: completedByExerciseId.get(we.id) ?? null,
      })),
    },
    log: { id: log.id, status: log.status, date: log.date },
  };
}

interface MarkExerciseInput {
  completed: boolean;
  actualSets?: number;
  actualReps?: string;
  actualWeightKg?: number;
}

async function markExerciseComplete(clientId: string, workoutExerciseId: string, input: MarkExerciseInput) {
  const we = await workoutExerciseRepository.findById(workoutExerciseId);
  if (!we || we.workoutDay.workoutPlan.clientId !== clientId) {
    throw new AppError('NOT_FOUND', 'Exercise not found on today\'s workout');
  }

  const date = todayDateOnly();
  const log = await workoutLogRepository.findOrCreateForDate(clientId, we.workoutDayId, date);
  if (log.status === 'NOT_STARTED') {
    await workoutLogRepository.markStatus(log.id, 'IN_PROGRESS');
  }

  return exerciseLogRepository.upsert(log.id, workoutExerciseId, input);
}

async function completeWorkout(clientId: string) {
  const plan = await workoutPlanRepository.findActiveForClient(clientId);
  if (!plan) throw new AppError('PLAN_NOT_ACTIVE', 'No active workout plan');

  const day = await resolveTodayDay(clientId, plan);
  if (!day) throw new AppError('NOT_FOUND', 'No workout scheduled for today');

  const date = todayDateOnly();
  const log = await workoutLogRepository.findOrCreateForDate(clientId, day.id, date);
  return workoutLogRepository.markStatus(log.id, 'COMPLETED');
}

async function listLogs(clientId: string, page: number, pageSize: number) {
  const [logs, total] = await workoutLogRepository.listForClient(clientId, page, pageSize);
  return { logs, total, page, pageSize };
}

export const workoutLogService = {
  getToday,
  markExerciseComplete,
  completeWorkout,
  listLogs,
};
