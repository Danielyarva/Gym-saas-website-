import type { Request } from 'express';
import { checkinRepository, type CheckInInput } from '../repositories/checkin.repository';
import { auditService } from './audit.service';
import { AppError } from '../utils/app-error';
import { todayDateOnly, dateOnly, daysBetween } from '../utils/date';

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

function toPublicCheckIn(checkIn: {
  id: string;
  date: Date;
  weightKg: unknown;
  workoutCompleted: boolean | null;
  steps: number | null;
  sleepHours: unknown;
  mood: string | null;
  energy: string | null;
  nutritionAdherence: string | null;
  notes: string | null;
}) {
  return {
    id: checkIn.id,
    date: checkIn.date,
    weightKg: toNumberOrNull(checkIn.weightKg),
    workoutCompleted: checkIn.workoutCompleted,
    steps: checkIn.steps,
    sleepHours: toNumberOrNull(checkIn.sleepHours),
    mood: checkIn.mood,
    energy: checkIn.energy,
    nutritionAdherence: checkIn.nutritionAdherence,
    notes: checkIn.notes,
  };
}

interface SubmitInput extends CheckInInput {
  date?: Date;
}

async function submit(clientId: string, input: SubmitInput, req: Request) {
  const today = todayDateOnly();
  const date = input.date ? dateOnly(input.date) : today;

  // Blocks backdating beyond yesterday, tolerates a late-night submit that
  // lands just after midnight for "yesterday's" check-in.
  const diff = daysBetween(today, date);
  if (diff < 0 || diff > 1) {
    throw new AppError('VALIDATION_ERROR', 'Check-ins can only be submitted for today or yesterday');
  }

  const checkIn = await checkinRepository.upsertForDate(clientId, date, {
    weightKg: input.weightKg,
    workoutCompleted: input.workoutCompleted,
    steps: input.steps,
    sleepHours: input.sleepHours,
    mood: input.mood,
    energy: input.energy,
    nutritionAdherence: input.nutritionAdherence,
    notes: input.notes,
  });

  await auditService.log({ req, actorUserId: req.user?.id, action: 'CHECK_IN_SUBMITTED', entityType: 'CLIENT', entityId: clientId, metadata: { date: date.toISOString() } });

  return toPublicCheckIn(checkIn);
}

async function getToday(clientId: string) {
  const checkIn = await checkinRepository.findForDate(clientId, todayDateOnly());
  return checkIn ? toPublicCheckIn(checkIn) : null;
}

async function list(clientId: string, filters: { from?: Date; to?: Date; page: number; pageSize: number }) {
  const [checkIns, total] = await checkinRepository.listForClient(clientId, filters);
  return { checkIns: checkIns.map(toPublicCheckIn), total, page: filters.page, pageSize: filters.pageSize };
}

export const checkinService = {
  submit,
  getToday,
  list,
};
