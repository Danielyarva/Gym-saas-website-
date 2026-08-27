import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const uuidNestedParamSchema = z.object({
  id: z.string().uuid(),
  noteId: z.string().uuid(),
});
