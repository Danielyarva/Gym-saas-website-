import type { AdherenceLevel } from '@prisma/client';
import { bodyMeasurementRepository } from '../repositories/body-measurement.repository';
import { checkinRepository } from '../repositories/checkin.repository';
import { todayDateOnly, subtractDays } from '../utils/date';

interface Point {
  date: string;
  value: number;
}

const RANGE_DAYS: Record<string, number | null> = {
  WEEKLY: 7,
  MONTHLY: 30,
  '3M': 90,
  '6M': 180,
  ALL: null,
};

const NUTRITION_ADHERENCE_SCORE: Record<AdherenceLevel, number> = { POOR: 25, FAIR: 50, GOOD: 75, EXCELLENT: 100 };

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getCharts(clientId: string, range: string) {
  const days = RANGE_DAYS[range] ?? null;
  const from = days !== null ? subtractDays(todayDateOnly(), days) : undefined;

  const [measurements, checkIns] = await Promise.all([
    bodyMeasurementRepository.listInRange(clientId, from),
    checkinRepository.listInRange(clientId, from),
  ]);

  const weight: Point[] = [];
  const waistCm: Point[] = [];
  const chestCm: Point[] = [];
  const armsCm: Point[] = [];
  const hipsCm: Point[] = [];
  const thighsCm: Point[] = [];

  // Weight also comes from BodyMeasurement's onboarding baseline row (the
  // only place a *measurement-source* weight point is ever written — the
  // check-in extension deliberately leaves weightKg off the measurements it
  // upserts, since weight already lives on DailyCheckIn directly below).
  for (const m of measurements) {
    const date = toDateStr(m.recordedAt);
    if (m.weightKg != null) weight.push({ date, value: Number(m.weightKg) });
    if (m.waistCm != null) waistCm.push({ date, value: Number(m.waistCm) });
    if (m.chestCm != null) chestCm.push({ date, value: Number(m.chestCm) });
    if (m.armsCm != null) armsCm.push({ date, value: Number(m.armsCm) });
    if (m.hipsCm != null) hipsCm.push({ date, value: Number(m.hipsCm) });
    if (m.thighsCm != null) thighsCm.push({ date, value: Number(m.thighsCm) });
  }

  const steps: Point[] = [];
  const sleepHours: Point[] = [];
  const workoutAdherence: Point[] = [];
  const nutritionAdherence: Point[] = [];

  for (const checkIn of checkIns) {
    const date = toDateStr(checkIn.date);
    if (checkIn.weightKg != null) weight.push({ date, value: Number(checkIn.weightKg) });
    if (checkIn.steps != null) steps.push({ date, value: checkIn.steps });
    if (checkIn.sleepHours != null) sleepHours.push({ date, value: Number(checkIn.sleepHours) });
    if (checkIn.workoutCompleted != null) workoutAdherence.push({ date, value: checkIn.workoutCompleted ? 100 : 0 });
    if (checkIn.nutritionAdherence != null) nutritionAdherence.push({ date, value: NUTRITION_ADHERENCE_SCORE[checkIn.nutritionAdherence] });
  }

  weight.sort((a, b) => a.date.localeCompare(b.date));

  return { weight, waistCm, chestCm, armsCm, hipsCm, thighsCm, steps, sleepHours, workoutAdherence, nutritionAdherence };
}

export const progressService = {
  getCharts,
};
