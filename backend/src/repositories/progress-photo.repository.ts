import { prisma } from '../config/prisma';

export interface CreateProgressPhotoInput {
  url: string;
  takenAt: Date;
  notes?: string;
}

export const progressPhotoRepository = {
  list(clientId: string, page: number, pageSize: number) {
    return Promise.all([
      prisma.progressPhoto.findMany({
        where: { clientId },
        orderBy: { takenAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.progressPhoto.count({ where: { clientId } }),
    ]);
  },

  create(clientId: string, input: CreateProgressPhotoInput) {
    return prisma.progressPhoto.create({ data: { clientId, ...input } });
  },

  findById(photoId: string) {
    return prisma.progressPhoto.findUnique({ where: { id: photoId } });
  },

  delete(photoId: string) {
    return prisma.progressPhoto.delete({ where: { id: photoId } });
  },
};
