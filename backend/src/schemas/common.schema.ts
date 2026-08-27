import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const uuidNestedParamSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
});

export const reorderIdsSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
