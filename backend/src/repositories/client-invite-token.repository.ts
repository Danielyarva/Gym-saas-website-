import { prisma } from '../config/prisma';

export const clientInviteTokenRepository = {
  create(data: { clientId: string; invitedByCoachId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.clientInviteToken.create({ data });
  },

  // Returns the raw row regardless of used/expired state so the service can
  // distinguish INVITE_INVALID (never existed / already used) from
  // INVITE_EXPIRED (existed, valid shape, just past expiresAt).
  findByTokenHash(tokenHash: string) {
    return prisma.clientInviteToken.findUnique({
      where: { tokenHash },
      include: { client: true },
    });
  },

  markUsed(id: string) {
    return prisma.clientInviteToken.update({ where: { id }, data: { usedAt: new Date() } });
  },
};
