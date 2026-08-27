import type { AuditAction, ClientStatus } from '@prisma/client';
import { clientRepository } from '../repositories/client.repository';
import { auditLogRepository } from '../repositories/audit-log.repository';

const RECENT_ACTIVITY_LIMIT = 10;

const ALERT_ACTIONS: AuditAction[] = ['CLIENT_STATUS_CHANGED'];

const ACTIVITY_SUMMARIES: Partial<Record<AuditAction, (metadata: unknown) => string>> = {
  CLIENT_CREATED: (metadata) => `Added client ${(metadata as { fullName?: string })?.fullName ?? ''}`.trim(),
  CLIENT_ARCHIVED: () => 'Archived a client',
  CLIENT_UNARCHIVED: () => 'Restored an archived client',
  CLIENT_STATUS_CHANGED: (metadata) => `Client status changed to ${(metadata as { status?: string })?.status ?? 'unknown'}`,
  CLIENT_NOTE_ADDED: () => 'Added a client note',
};

function summarize(action: AuditAction, metadata: unknown): string {
  return ACTIVITY_SUMMARIES[action]?.(metadata) ?? action.replace(/_/g, ' ').toLowerCase();
}

async function getDashboard(coachId: string) {
  const [statusRows, averages, recentLogs] = await Promise.all([
    clientRepository.countByStatus(coachId),
    clientRepository.averageAdherenceAndProgress(coachId),
    auditLogRepository.listRecentForCoach(coachId, RECENT_ACTIVITY_LIMIT),
  ]);

  const countFor = (status: ClientStatus) => statusRows.find((row) => row.status === status)?._count ?? 0;
  const activeClients = statusRows.reduce((sum, row) => sum + row._count, 0);

  const recentActivity = recentLogs
    .filter((log) => !ALERT_ACTIONS.includes(log.action))
    .map((log) => ({ id: log.id, action: log.action, entityId: log.entityId, summary: summarize(log.action, log.metadata), createdAt: log.createdAt }));

  const recentAlerts = recentLogs
    .filter((log) => ALERT_ACTIONS.includes(log.action))
    .map((log) => ({ id: log.id, action: log.action, entityId: log.entityId, summary: summarize(log.action, log.metadata), createdAt: log.createdAt }));

  return {
    activeClients,
    statusBreakdown: {
      onTrack: countFor('ON_TRACK'),
      needsAttention: countFor('NEEDS_ATTENTION'),
      atRisk: countFor('AT_RISK'),
    },
    averageAdherencePct: averages.adherencePct !== null ? Math.round(averages.adherencePct) : null,
    averageProgressPct: averages.progressPct !== null ? Math.round(averages.progressPct) : null,
    clientProgressChart: { available: false, series: [] as Array<{ date: string; value: number }> },
    recentActivity,
    recentAlerts,
    // No AI analysis (Phase 4) or task tracking exists yet — the frontend
    // renders a real empty state on `available: false`, never a fake list.
    aiInsights: { available: false, items: [] as string[] },
    upcomingTasks: { available: false, items: [] as string[] },
  };
}

export const dashboardService = {
  getDashboard,
};
