import type { AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateAuditLogInput {
  actorUserId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

export const auditLogRepository = {
  create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({ data: input });
  },

  /** Recent audit log rows for entities belonging to this coach's clients — feeds the dashboard's activity/alerts panels. */
  async listRecentForCoach(coachId: string, limit: number) {
    const coachClients = await prisma.coachClient.findMany({ where: { coachId }, select: { clientId: true } });
    const clientIds = coachClients.map((row) => row.clientId);

    if (clientIds.length === 0) return [];

    return prisma.auditLog.findMany({
      where: { entityType: 'CLIENT', entityId: { in: clientIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};
