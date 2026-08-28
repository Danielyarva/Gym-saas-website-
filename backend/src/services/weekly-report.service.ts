import type { Request } from 'express';
import { z } from 'zod';
import type { AdherenceLevel, WeeklyReport } from '@prisma/client';
import { checkinRepository, weightProgressPct } from '../repositories/checkin.repository';
import { clientRepository } from '../repositories/client.repository';
import { weeklyReportRepository } from '../repositories/weekly-report.repository';
import { buildClientContext } from '../ai/context.service';
import { aiService } from '../ai';
import { AI_MODELS } from '../ai/models';
import { auditService } from './audit.service';
import { notificationService } from './notification.service';
import { weeklyReportQueue } from '../jobs/queues';
import { todayDateOnly, dateOnly, subtractDays } from '../utils/date';

const MAX_OUTPUT_TOKENS = 1536;
const NUTRITION_ADHERENCE_SCORE: Record<AdherenceLevel, number> = { POOR: 25, FAIR: 50, GOOD: 75, EXCELLENT: 100 };

const narrativeOutputSchema = z.object({
  wins: z.array(z.string().min(1).max(300)).min(1).max(5),
  problems: z.array(z.string().min(1).max(300)).max(5),
  aiSummary: z.string().min(1).max(1500),
  suggestedActions: z.array(z.string().min(1).max(300)).min(1).max(5),
});

const SYSTEM_PROMPT = `You are writing a weekly progress report for a fitness coach about one of their clients, summarizing the client's last 7 days.

You are given the week's computed metrics (already calculated — do not recompute or contradict them) and the client's broader context. Write a short narrative summary, 1-5 concrete wins, 0-5 problems worth the coach's attention, and 1-5 suggested actions for the coach's next conversation with this client. This report is for the coach only — it never reaches the client directly and never changes their plan on its own.`;

function mondayOf(date: Date): Date {
  const d = dateOnly(date);
  const day = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return subtractDays(d, daysSinceMonday);
}

/** The most recently completed Mon–Sun week — the week ending today doesn't count as "completed" until tomorrow. */
function mostRecentCompletedWeek(today: Date): { weekStart: Date; weekEnd: Date } {
  const day = today.getUTCDay();
  const daysSinceLastCompletedSunday = day === 0 ? 7 : day;
  const weekEnd = subtractDays(today, daysSinceLastCompletedSunday);
  const weekStart = subtractDays(weekEnd, 6);
  return { weekStart, weekEnd };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

async function computeMetrics(clientId: string, weekStart: Date, weekEnd: Date) {
  const [fromWeekStart, profile] = await Promise.all([
    checkinRepository.listInRange(clientId, weekStart),
    clientRepository.findOwnProfile(clientId),
  ]);

  const weekEndTime = weekEnd.getTime();
  const checkIns = fromWeekStart.filter((checkIn) => checkIn.date.getTime() <= weekEndTime);

  const weightEntries = checkIns.filter((checkIn) => checkIn.weightKg != null);
  const weightChangeKg =
    weightEntries.length >= 2 ? round1(Number(weightEntries[weightEntries.length - 1]!.weightKg) - Number(weightEntries[0]!.weightKg)) : null;

  const workoutEntries = checkIns.filter((checkIn) => checkIn.workoutCompleted != null);
  const workoutAdherencePct =
    workoutEntries.length > 0 ? Math.round((workoutEntries.filter((checkIn) => checkIn.workoutCompleted).length / workoutEntries.length) * 100) : null;

  const nutritionEntries = checkIns.filter((checkIn) => checkIn.nutritionAdherence != null);
  const nutritionAdherencePct =
    nutritionEntries.length > 0
      ? Math.round(nutritionEntries.reduce((sum, checkIn) => sum + NUTRITION_ADHERENCE_SCORE[checkIn.nutritionAdherence!], 0) / nutritionEntries.length)
      : null;

  const stepsEntries = checkIns.filter((checkIn) => checkIn.steps != null);
  const avgSteps = stepsEntries.length > 0 ? Math.round(stepsEntries.reduce((sum, checkIn) => sum + checkIn.steps!, 0) / stepsEntries.length) : null;

  const sleepEntries = checkIns.filter((checkIn) => checkIn.sleepHours != null);
  const avgSleepHours =
    sleepEntries.length > 0 ? round1(sleepEntries.reduce((sum, checkIn) => sum + Number(checkIn.sleepHours), 0) / sleepEntries.length) : null;

  // Live progress toward the client's goal, the same figure CoachClient.progressPct already tracks — not a
  // week-specific snapshot, since no historical starting/current-weight snapshot exists per week.
  const overallProgressPct =
    profile?.profile?.startingWeightKg != null && profile.profile.currentWeightKg != null && profile.profile.goalWeightKg != null
      ? weightProgressPct(Number(profile.profile.startingWeightKg), Number(profile.profile.currentWeightKg), Number(profile.profile.goalWeightKg))
      : null;

  return { overallProgressPct, weightChangeKg, workoutAdherencePct, nutritionAdherencePct, avgSteps, avgSleepHours };
}

function toPublicReport(report: WeeklyReport) {
  return {
    id: report.id,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    overallProgressPct: report.overallProgressPct != null ? Number(report.overallProgressPct) : null,
    weightChangeKg: report.weightChangeKg != null ? Number(report.weightChangeKg) : null,
    workoutAdherencePct: report.workoutAdherencePct,
    nutritionAdherencePct: report.nutritionAdherencePct,
    avgSteps: report.avgSteps,
    avgSleepHours: report.avgSleepHours != null ? Number(report.avgSleepHours) : null,
    wins: report.wins,
    problems: report.problems,
    aiSummary: report.aiSummary,
    suggestedActions: report.suggestedActions,
    createdAt: report.createdAt,
  };
}

function metricsPromptBlock(weekStart: Date, weekEnd: Date, metrics: Awaited<ReturnType<typeof computeMetrics>>): string {
  return `Week: ${weekStart.toISOString().slice(0, 10)} to ${weekEnd.toISOString().slice(0, 10)}

Computed metrics for this week:
- Weight change: ${metrics.weightChangeKg ?? 'no data'} kg
- Workout adherence: ${metrics.workoutAdherencePct ?? 'no data'}%
- Nutrition adherence: ${metrics.nutritionAdherencePct ?? 'no data'}%
- Average daily steps: ${metrics.avgSteps ?? 'no data'}
- Average sleep: ${metrics.avgSleepHours ?? 'no data'} hours
- Overall progress toward goal: ${metrics.overallProgressPct ?? 'no data'}%`;
}

async function generate(clientId: string, weekStartInput: Date | undefined, req?: Request) {
  const { weekStart, weekEnd } = weekStartInput
    ? { weekStart: mondayOf(weekStartInput), weekEnd: subtractDays(mondayOf(weekStartInput), -6) }
    : mostRecentCompletedWeek(todayDateOnly());

  const metrics = await computeMetrics(clientId, weekStart, weekEnd);
  const context = await buildClientContext(clientId);
  const prompt = `${metricsPromptBlock(weekStart, weekEnd, metrics)}

Client context:
${context}`;

  const narrative = await aiService.generateStructuredOutput({
    clientId,
    feature: 'weekly_report',
    system: SYSTEM_PROMPT,
    prompt,
    model: AI_MODELS.WEEKLY_REPORT,
    maxTokens: MAX_OUTPUT_TOKENS,
    schema: narrativeOutputSchema,
    toolName: 'submit_weekly_report',
    toolDescription: 'Submit the weekly coaching report narrative',
  });

  const report = await weeklyReportRepository.upsert(clientId, weekStart, weekEnd, { ...metrics, ...narrative });

  await auditService.log({
    req,
    actorUserId: req?.user?.id,
    action: 'AI_WEEKLY_REPORT_GENERATED',
    entityType: 'CLIENT',
    entityId: clientId,
    metadata: { weekStart: weekStart.toISOString() },
  });

  await notificationService.notifyWeeklyReport(clientId);

  return toPublicReport(report);
}

/**
 * The weekly repeatable job's fan-out (worker.ts, PRD §19's literal "every
 * week generate" — deferred since Phase 4 for lack of a job queue). Reuses
 * 100% of `generate`'s existing metrics + AI-narrative logic per client;
 * skips clients with no check-in data for the week rather than generating a
 * meaningless empty report.
 */
async function generateForAllActiveClients(): Promise<void> {
  const { weekStart, weekEnd } = mostRecentCompletedWeek(todayDateOnly());
  const clients = await clientRepository.listActiveWithCheckInsInRange(weekStart, weekEnd);
  await Promise.all(clients.map((client) => weeklyReportQueue.add('generate-one', { clientId: client.id })));
}

async function list(clientId: string, page: number, pageSize: number) {
  const [reports, total] = await weeklyReportRepository.listForClient(clientId, page, pageSize);
  return { reports: reports.map(toPublicReport), total, page, pageSize };
}

async function listForCoach(coachId: string, page: number, pageSize: number) {
  const [reports, total] = await weeklyReportRepository.listForCoach(coachId, page, pageSize);
  return {
    reports: reports.map((report) => ({ ...toPublicReport(report), client: { id: report.client.id, fullName: report.client.fullName } })),
    total,
    page,
    pageSize,
  };
}

export const weeklyReportService = {
  generate,
  generateForAllActiveClients,
  list,
  listForCoach,
};
