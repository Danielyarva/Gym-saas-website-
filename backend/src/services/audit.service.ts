import type { Request } from 'express';
import type { AuditAction, Prisma } from '@prisma/client';
import { auditLogRepository } from '../repositories/audit-log.repository';

interface LogParams {
  req?: Request;
  actorUserId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

export const auditService = {
  log({ req, actorUserId, action, entityType, entityId, metadata }: LogParams) {
    return auditLogRepository.create({
      actorUserId,
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
    });
  },
};
