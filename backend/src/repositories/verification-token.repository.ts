import { prisma } from '../config/prisma';

export const emailVerificationTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.emailVerificationToken.create({ data });
  },

  findValidByTokenHash(tokenHash: string) {
    return prisma.emailVerificationToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markUsed(id: string) {
    return prisma.emailVerificationToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
};

export const passwordResetTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({ data });
  },

  findValidByTokenHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
  },

  markUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
};
