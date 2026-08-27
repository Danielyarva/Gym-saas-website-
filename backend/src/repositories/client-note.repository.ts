import { prisma } from '../config/prisma';

export const clientNoteRepository = {
  listForClient(clientId: string) {
    return prisma.clientNote.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      include: { coach: { select: { fullName: true } } },
    });
  },

  create(clientId: string, coachId: string, body: string) {
    return prisma.clientNote.create({
      data: { clientId, coachId, body },
      include: { coach: { select: { fullName: true } } },
    });
  },

  findById(id: string) {
    return prisma.clientNote.findUnique({ where: { id } });
  },

  update(id: string, body: string) {
    return prisma.clientNote.update({
      where: { id },
      data: { body },
      include: { coach: { select: { fullName: true } } },
    });
  },

  delete(id: string) {
    return prisma.clientNote.delete({ where: { id } });
  },
};
