import { prisma } from '../config/prisma';

/**
 * Phase 8 — the first legitimately unscoped repository in this codebase.
 * Every other repository takes a coachId and can't return another coach's
 * data (see client.repository.ts's own comment on that invariant); these
 * queries are deliberately platform-wide, for the ADMIN-only dashboard.
 */
export const adminAnalyticsRepository = {
  countTotalCoaches() {
    return prisma.user.count({ where: { role: 'COACH' } });
  },

  countNewCoachesSince(since: Date) {
    return prisma.user.count({ where: { role: 'COACH', createdAt: { gte: since } } });
  },

  /** Raw signup timestamps for the weekly-trend chart — bucketed in JS (admin-analytics.service.ts), not persisted snapshots. */
  listCoachSignupDatesSince(since: Date) {
    return prisma.user.findMany({ where: { role: 'COACH', createdAt: { gte: since } }, select: { createdAt: true } });
  },

  countActiveCoachesSince(since: Date) {
    return prisma.user.count({ where: { role: 'COACH', lastLoginAt: { gte: since } } });
  },

  countActiveClientsGlobal() {
    return prisma.coachClient.count({ where: { archivedAt: null } });
  },

  countWeeklyActiveUsers(since: Date) {
    return prisma.user.count({ where: { role: { in: ['COACH', 'CLIENT'] }, lastLoginAt: { gte: since } } });
  },

  /** Active (non-archived) clients with at least one check-in since `since` — the check-in-rate numerator. */
  async countActiveClientsWithCheckInSince(since: Date): Promise<number> {
    const rows = await prisma.dailyCheckIn.findMany({
      where: { date: { gte: since }, client: { coachClient: { archivedAt: null } } },
      distinct: ['clientId'],
      select: { clientId: true },
    });
    return rows.length;
  },

  aiUsageAggregateSince(since: Date) {
    return prisma.aiUsageLog.aggregate({ where: { createdAt: { gte: since } }, _count: true, _sum: { estimatedCostUsd: true } });
  },

  /** Coaches who have ever had a captured payment — the conversion numerator and the churn denominator. */
  async listCoachIdsWithCapturedPayment(): Promise<string[]> {
    const rows = await prisma.payment.groupBy({ by: ['coachId'], where: { status: 'CAPTURED' } });
    return rows.map((row) => row.coachId);
  },

  /** Raw rows, not a count — churn needs the effective-status recomputation in admin-analytics.service.ts, not the possibly-stale `status` column alone. */
  listSubscriptions() {
    return prisma.subscription.findMany({ select: { coachId: true, status: true, plan: true, currentPeriodEnd: true } });
  },

  /** Clients are never hard-deleted (only archived), so an unfiltered count is "ever created" — the retention denominator. */
  countClientsEverCreated() {
    return prisma.client.count();
  },
};
