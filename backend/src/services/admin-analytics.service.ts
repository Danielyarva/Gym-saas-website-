import type { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { adminAnalyticsRepository } from '../repositories/admin-analytics.repository';
import { redisConnection } from '../jobs/connection';
import { subtractDays, todayDateOnly } from '../utils/date';

const CACHE_KEY = 'admin:analytics:v1';
const CACHE_TTL_SECONDS = 300;

const NEW_COACH_WINDOW_DAYS = 30;
const ACTIVE_COACH_WINDOW_DAYS = 30;
const WAU_WINDOW_DAYS = 7;
const CHECKIN_RATE_WINDOW_DAYS = 7;
const AI_USAGE_WINDOW_DAYS = 30;
const SIGNUP_TREND_WEEKS = 8;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? round1((numerator / denominator) * 100) : null;
}

/**
 * subscription.service.ts#ensureCurrent only flips a lapsed paid plan to
 * CANCELED lazily, the next time that coach hits a subscription endpoint —
 * there's no sweep. Trusting the stored `status` alone would under-count
 * churn and make the number drift with unrelated coach activity instead of
 * time, so it's recomputed here the same way `ensureCurrent` would, without
 * writing anything.
 */
function isEffectivelyChurned(sub: { status: SubscriptionStatus; plan: SubscriptionPlan; currentPeriodEnd: Date | null }): boolean {
  if (sub.status === 'CANCELED') return true;
  return sub.plan !== 'STARTER' && sub.currentPeriodEnd !== null && sub.currentPeriodEnd < new Date();
}

/** Buckets real signup timestamps into weekly counts, oldest first — no persisted snapshots needed since User.createdAt is already a real historical timestamp. */
function bucketByWeek(dates: Date[], weeks: number): Array<{ weekStart: string; count: number }> {
  const now = todayDateOnly();
  const oldestWeekStart = subtractDays(now, (weeks - 1) * 7);
  const counts = new Array(weeks).fill(0) as number[];

  for (const date of dates) {
    const dayOnly = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const daysSinceOldest = Math.floor((dayOnly.getTime() - oldestWeekStart.getTime()) / (24 * 60 * 60 * 1000));
    const bucketIndex = Math.floor(daysSinceOldest / 7);
    if (bucketIndex >= 0 && bucketIndex < weeks) counts[bucketIndex] = (counts[bucketIndex] ?? 0) + 1;
  }

  return counts.map((count, i) => ({ weekStart: subtractDays(now, (weeks - 1 - i) * 7).toISOString().slice(0, 10), count }));
}

async function computeAnalytics() {
  const signupTrendStart = subtractDays(todayDateOnly(), (SIGNUP_TREND_WEEKS - 1) * 7);
  const checkinWindowStart = subtractDays(todayDateOnly(), CHECKIN_RATE_WINDOW_DAYS);

  const [
    totalCoaches,
    newCoachesCount,
    signupDatesForTrend,
    activeCoachesCount,
    activeClientsCount,
    weeklyActiveUsersCount,
    activeClientsWithCheckInCount,
    aiUsage,
    everPaidCoachIds,
    subscriptions,
    clientsEverCreated,
  ] = await Promise.all([
    adminAnalyticsRepository.countTotalCoaches(),
    adminAnalyticsRepository.countNewCoachesSince(daysAgo(NEW_COACH_WINDOW_DAYS)),
    adminAnalyticsRepository.listCoachSignupDatesSince(signupTrendStart),
    adminAnalyticsRepository.countActiveCoachesSince(daysAgo(ACTIVE_COACH_WINDOW_DAYS)),
    adminAnalyticsRepository.countActiveClientsGlobal(),
    adminAnalyticsRepository.countWeeklyActiveUsers(daysAgo(WAU_WINDOW_DAYS)),
    adminAnalyticsRepository.countActiveClientsWithCheckInSince(checkinWindowStart),
    adminAnalyticsRepository.aiUsageAggregateSince(daysAgo(AI_USAGE_WINDOW_DAYS)),
    adminAnalyticsRepository.listCoachIdsWithCapturedPayment(),
    adminAnalyticsRepository.listSubscriptions(),
    adminAnalyticsRepository.countClientsEverCreated(),
  ]);

  const everPaidSet = new Set(everPaidCoachIds);
  const churnedCount = subscriptions.filter((sub) => everPaidSet.has(sub.coachId) && isEffectivelyChurned(sub)).length;

  return {
    newCoaches: { count: newCoachesCount, windowDays: NEW_COACH_WINDOW_DAYS },
    newCoachesWeeklyTrend: bucketByWeek(
      signupDatesForTrend.map((row) => row.createdAt),
      SIGNUP_TREND_WEEKS,
    ),
    activeCoaches: { count: activeCoachesCount, windowDays: ACTIVE_COACH_WINDOW_DAYS, totalCoaches },
    activeClients: { count: activeClientsCount },
    weeklyActiveUsers: { count: weeklyActiveUsersCount, windowDays: WAU_WINDOW_DAYS },
    checkInRate: {
      pct: ratio(activeClientsWithCheckInCount, activeClientsCount),
      numerator: activeClientsWithCheckInCount,
      denominator: activeClientsCount,
      windowDays: CHECKIN_RATE_WINDOW_DAYS,
    },
    aiUsage: {
      requestCount: aiUsage._count,
      estimatedCostUsd: aiUsage._sum.estimatedCostUsd !== null ? Number(aiUsage._sum.estimatedCostUsd) : 0,
      windowDays: AI_USAGE_WINDOW_DAYS,
    },
    subscriptionConversion: { pct: ratio(everPaidCoachIds.length, totalCoaches), numerator: everPaidCoachIds.length, denominator: totalCoaches },
    churn: { pct: ratio(churnedCount, everPaidCoachIds.length), numerator: churnedCount, denominator: everPaidCoachIds.length },
    clientRetention: { pct: ratio(activeClientsCount, clientsEverCreated), numerator: activeClientsCount, denominator: clientsEverCreated },
  };
}

export type AdminAnalytics = Awaited<ReturnType<typeof computeAnalytics>>;

/**
 * The first non-BullMQ use of the shared Redis connection (jobs/connection.ts)
 * — a plain short-TTL cache key, not a job queue. computeAnalytics runs
 * several platform-wide aggregate scans; caching avoids re-running all of
 * them on every admin dashboard load.
 */
async function getAnalytics(): Promise<AdminAnalytics> {
  const cached = await redisConnection.get(CACHE_KEY);
  if (cached) return JSON.parse(cached) as AdminAnalytics;

  const analytics = await computeAnalytics();
  await redisConnection.set(CACHE_KEY, JSON.stringify(analytics), 'EX', CACHE_TTL_SECONDS);
  return analytics;
}

export const adminAnalyticsService = {
  getAnalytics,
};
