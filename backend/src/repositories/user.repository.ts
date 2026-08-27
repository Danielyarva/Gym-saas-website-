import { prisma } from '../config/prisma';
import type { Role } from '@prisma/client';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  create(data: { email: string; passwordHash: string; role: Role }) {
    return prisma.user.create({ data });
  },

  markEmailVerified(id: string) {
    return prisma.user.update({
      where: { id },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  touchLastLogin(id: string) {
    return prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  },
};
