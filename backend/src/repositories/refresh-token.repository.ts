import { prisma } from '../config/prisma';

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date; userAgent?: string; ipAddress?: string }) {
    return prisma.refreshToken.create({ data });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  async rotate(oldTokenHash: string, newTokenHash: string, expiresAt: Date, userId: string, userAgent?: string, ipAddress?: string) {
    return prisma.$transaction([
      prisma.refreshToken.update({
        where: { tokenHash: oldTokenHash },
        data: { revokedAt: new Date(), replacedByTokenHash: newTokenHash },
      }),
      prisma.refreshToken.create({
        data: { userId, tokenHash: newTokenHash, expiresAt, userAgent, ipAddress },
      }),
    ]);
  },

  revokeByTokenHash(tokenHash: string) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  listActiveForUser(userId: string) {
    return prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  },

  findActiveByIdForUser(id: string, userId: string) {
    return prisma.refreshToken.findFirst({ where: { id, userId, revokedAt: null } });
  },
};
