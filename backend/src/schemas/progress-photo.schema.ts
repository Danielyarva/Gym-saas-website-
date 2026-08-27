import { z } from 'zod';

export const uploadPhotoBodySchema = z.object({
  takenAt: z.coerce.date().optional(),
});

export const listProgressPhotosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const photoIdParamSchema = z.object({
  id: z.string().uuid(),
  photoId: z.string().uuid(),
});
